# AgentBoard — Guía de Integración

## Requisitos Previos

```bash
cd KanbanAgent
npm install
npm run dev
# → http://localhost:3000
```

La API estará disponible en `http://localhost:3000/api`.

---

## Parte 1: Verificación Rápida con cURL

Antes de conectar cualquier agente, verifica que la API responde:

```bash
# Listar tareas
curl http://localhost:3000/api/tasks | jq

# Crear una tarea
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi primera tarea desde CLI",
    "description": "Probando la integración",
    "projectId": "proj-agentboard",
    "tags": ["test"]
  }' | jq

# Listar agentes disponibles
curl http://localhost:3000/api/agents | jq
```

---

## Parte 2: Integración con Agentes IA

### 2.1 Claude Code (via MCP / Tool Use)

Claude Code puede interactuar con AgentBoard mediante **herramientas personalizadas** definidas en un archivo de configuración MCP. Esto permite que Claude use el tablero como parte de su flujo de trabajo.

#### Opción A: Usar `CLAUDE.md` con instrucciones directas

Agrega al `CLAUDE.md` del proyecto las instrucciones para que Claude Code sepa cómo usar la API:

```markdown
## AgentBoard Integration

El tablero Kanban corre en http://localhost:3000. Usa estas APIs para reportar progreso:

### Flujo de trabajo:
1. Al iniciar una tarea: `PATCH /api/tasks/:id/status` con `{"status": "IN_PROGRESS"}`
2. Al completar trabajo: `POST /api/tasks/:id/evidence` con logs o links
3. Al terminar: `POST /api/tasks/:id/review-request`
4. Si te rechazan: lee los `reviewComments` del task y corrige

### Ejemplos:
- Buscar tu tarea: `curl http://localhost:3000/api/tasks?agent_id=agent-claude-backend`
- Actualizar estado: `curl -X PATCH http://localhost:3000/api/tasks/task-001/status -H "Content-Type: application/json" -d '{"status":"IN_PROGRESS"}'`
- Agregar evidencia: `curl -X POST http://localhost:3000/api/tasks/task-001/evidence -H "Content-Type: application/json" -d '{"type":"LOG","content":"Tests passing"}'`
- Solicitar review: `curl -X POST http://localhost:3000/api/tasks/task-001/review-request`
```

#### Opción B: MCP Server (recomendado para producción)

Crea un servidor MCP que exponga las operaciones del tablero como tools. Archivo `mcp-agentboard.ts`:

```typescript
// mcp-agentboard.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BOARD_URL = process.env.AGENTBOARD_URL || "http://localhost:3000";

const server = new McpServer({
  name: "agentboard",
  version: "0.1.0",
});

// Tool: Obtener tareas asignadas
server.tool(
  "get_my_tasks",
  "Retrieve tasks assigned to this agent",
  { agent_id: z.string().describe("Your agent ID") },
  async ({ agent_id }) => {
    const res = await fetch(`${BOARD_URL}/api/tasks?agent_id=${agent_id}`);
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// Tool: Actualizar estado de tarea
server.tool(
  "update_task_status",
  "Move a task to a new status (BACKLOG→ASSIGNED→IN_PROGRESS→REVIEW→APPROVED→DONE)",
  {
    task_id: z.string(),
    status: z.enum(["BACKLOG","ASSIGNED","IN_PROGRESS","REVIEW","APPROVED","REJECTED","DONE"]),
    comment: z.string().optional(),
  },
  async ({ task_id, status, comment }) => {
    const res = await fetch(`${BOARD_URL}/api/tasks/${task_id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, comment }),
    });
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// Tool: Adjuntar evidencia
server.tool(
  "add_evidence",
  "Attach evidence to a task (screenshots, logs, PR links, files)",
  {
    task_id: z.string(),
    type: z.enum(["SCREENSHOT", "LOG", "FILE", "PR_LINK", "CUSTOM"]),
    content: z.string().optional().describe("Text content (for LOG type)"),
    url: z.string().optional().describe("URL (for SCREENSHOT, PR_LINK, FILE)"),
    context: z.string().optional().describe("What this evidence shows"),
  },
  async ({ task_id, type, content, url, context }) => {
    const res = await fetch(`${BOARD_URL}/api/tasks/${task_id}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content, url, context }),
    });
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// Tool: Solicitar review
server.tool(
  "request_review",
  "Submit a task for human review after completing work",
  { task_id: z.string() },
  async ({ task_id }) => {
    const res = await fetch(`${BOARD_URL}/api/tasks/${task_id}/review-request`, {
      method: "POST",
    });
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// Tool: Crear tarea
server.tool(
  "create_task",
  "Create a new task on the board",
  {
    title: z.string(),
    description: z.string(),
    project_id: z.string().default("proj-agentboard"),
    tags: z.array(z.string()).optional(),
    agent_id: z.string().optional(),
  },
  async ({ title, description, project_id, tags, agent_id }) => {
    const res = await fetch(`${BOARD_URL}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description,
        projectId: project_id,
        tags,
        agentId: agent_id,
        createdBy: agent_id || "human",
      }),
    });
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

Regístralo en `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agentboard": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp-agentboard.ts"],
      "env": {
        "AGENTBOARD_URL": "http://localhost:3000"
      }
    }
  }
}
```

Una vez configurado, Claude Code puede hacer cosas como:
> "Revisa mis tareas pendientes, toma la primera del backlog, márcala como in progress, y cuando termines adjunta los logs como evidencia y solicita review."

---

### 2.2 Antigravity

Antigravity soporta tool use y HTTP calls. La integración es directa via su sistema de herramientas:

```python
# antigravity_agentboard.py
import requests

BOARD_URL = "http://localhost:3000"
AGENT_ID = "agent-antigravity-qa"

class AgentBoardClient:
    def __init__(self, base_url=BOARD_URL, agent_id=AGENT_ID):
        self.base_url = base_url
        self.agent_id = agent_id

    def get_my_tasks(self, status=None):
        params = {"agent_id": self.agent_id}
        if status:
            params["status"] = status
        r = requests.get(f"{self.base_url}/api/tasks", params=params)
        return r.json()["tasks"]

    def claim_task(self, task_id):
        """Marca una tarea como IN_PROGRESS"""
        r = requests.patch(
            f"{self.base_url}/api/tasks/{task_id}/status",
            json={"status": "IN_PROGRESS"}
        )
        return r.json()

    def add_evidence(self, task_id, evidence_type, content=None, url=None, context=None):
        r = requests.post(
            f"{self.base_url}/api/tasks/{task_id}/evidence",
            json={"type": evidence_type, "content": content, "url": url, "context": context}
        )
        return r.json()

    def request_review(self, task_id):
        r = requests.post(f"{self.base_url}/api/tasks/{task_id}/review-request")
        return r.json()

    def create_task(self, title, description, tags=None):
        r = requests.post(
            f"{self.base_url}/api/tasks",
            json={
                "title": title,
                "description": description,
                "projectId": "proj-agentboard",
                "createdBy": self.agent_id,
                "tags": tags or [],
            }
        )
        return r.json()

    def get_rejection_feedback(self, task_id):
        """Lee los comentarios de rechazo para iterar"""
        r = requests.get(f"{self.base_url}/api/tasks/{task_id}")
        task = r.json()["task"]
        return task["reviewComments"]


# --- Flujo típico de un agente Antigravity ---
if __name__ == "__main__":
    board = AgentBoardClient()

    # 1. Buscar tareas asignadas
    tasks = board.get_my_tasks(status="ASSIGNED")
    if not tasks:
        print("No hay tareas asignadas")
        exit()

    task = tasks[0]
    print(f"Trabajando en: {task['title']}")

    # 2. Empezar a trabajar
    board.claim_task(task["id"])

    # 3. Hacer el trabajo...
    # (tu lógica de agente aquí)

    # 4. Adjuntar evidencia
    board.add_evidence(
        task["id"],
        evidence_type="LOG",
        content="QA tests passed: 47/47 scenarios green",
        context="Full regression suite"
    )

    # 5. Pedir review
    result = board.request_review(task["id"])
    print(f"Review solicitado: {result['message']}")
```

---

### 2.3 OpenAI Codex / GPT con Function Calling

Para conectar GPT-4o o Codex via la API de OpenAI, define las funciones como tools:

```python
import openai
import requests
import json

BOARD_URL = "http://localhost:3000"

# Definir las herramientas del tablero como OpenAI tools
agentboard_tools = [
    {
        "type": "function",
        "function": {
            "name": "list_tasks",
            "description": "List tasks from AgentBoard, optionally filtered by status or agent",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["BACKLOG","ASSIGNED","IN_PROGRESS","REVIEW","APPROVED","REJECTED","DONE"],
                        "description": "Filter by task status"
                    },
                    "agent_id": {"type": "string", "description": "Filter by agent ID"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_task_status",
            "description": "Change a task's status. Valid transitions: BACKLOG→ASSIGNED/IN_PROGRESS, ASSIGNED→IN_PROGRESS, IN_PROGRESS→REVIEW, REVIEW→APPROVED/REJECTED, REJECTED→IN_PROGRESS, APPROVED→DONE",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "string"},
                    "status": {
                        "type": "string",
                        "enum": ["BACKLOG","ASSIGNED","IN_PROGRESS","REVIEW","APPROVED","REJECTED","DONE"]
                    },
                    "comment": {"type": "string", "description": "Optional comment"}
                },
                "required": ["task_id", "status"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_evidence",
            "description": "Attach evidence to a task",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "string"},
                    "type": {"type": "string", "enum": ["SCREENSHOT","LOG","FILE","PR_LINK","CUSTOM"]},
                    "content": {"type": "string", "description": "Text content"},
                    "url": {"type": "string", "description": "URL reference"},
                    "context": {"type": "string", "description": "What this evidence shows"}
                },
                "required": ["task_id", "type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "request_review",
            "description": "Submit task for human review. Task must be IN_PROGRESS or REJECTED.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "string"}
                },
                "required": ["task_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Create a new task on the board",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "tags": {"type": "array", "items": {"type": "string"}},
                    "agent_id": {"type": "string", "description": "Agent to assign"}
                },
                "required": ["title", "description"]
            }
        }
    }
]


def execute_tool(name, args):
    """Ejecuta la llamada a AgentBoard API"""
    if name == "list_tasks":
        params = {k: v for k, v in args.items() if v}
        r = requests.get(f"{BOARD_URL}/api/tasks", params=params)
        return r.json()

    elif name == "update_task_status":
        r = requests.patch(
            f"{BOARD_URL}/api/tasks/{args['task_id']}/status",
            json={"status": args["status"], "comment": args.get("comment")}
        )
        return r.json()

    elif name == "add_evidence":
        payload = {k: v for k, v in args.items() if k != "task_id" and v}
        r = requests.post(
            f"{BOARD_URL}/api/tasks/{args['task_id']}/evidence",
            json=payload
        )
        return r.json()

    elif name == "request_review":
        r = requests.post(f"{BOARD_URL}/api/tasks/{args['task_id']}/review-request")
        return r.json()

    elif name == "create_task":
        r = requests.post(
            f"{BOARD_URL}/api/tasks",
            json={
                "title": args["title"],
                "description": args["description"],
                "projectId": "proj-agentboard",
                "tags": args.get("tags", []),
                "agentId": args.get("agent_id"),
                "createdBy": args.get("agent_id", "human"),
            }
        )
        return r.json()


def run_agent_loop(system_prompt, user_message):
    """Loop de agente con tool calling"""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    while True:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=agentboard_tools,
        )

        choice = response.choices[0]

        if choice.finish_reason == "stop":
            print(f"Agent: {choice.message.content}")
            break

        if choice.finish_reason == "tool_calls":
            messages.append(choice.message)
            for tool_call in choice.message.tool_calls:
                args = json.loads(tool_call.function.arguments)
                result = execute_tool(tool_call.function.name, args)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result),
                })


# --- Ejemplo de uso ---
run_agent_loop(
    system_prompt=(
        "You are agent-gpt-frontend. You work on frontend tasks from AgentBoard. "
        "Start by checking your assigned tasks, work on them, then request review."
    ),
    user_message="Check the board and start working on your next task."
)
```

---

## Parte 3: Integración con OpenRouter

OpenRouter actúa como proxy para múltiples modelos (Claude, GPT, Llama, Gemini, etc.). La integración es idéntica al patrón de OpenAI porque OpenRouter es compatible con la API de OpenAI.

### 3.1 Configuración Básica

```python
import openai

# OpenRouter usa la misma interfaz que OpenAI
client = openai.OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-v1-YOUR_OPENROUTER_KEY",
    default_headers={
        "HTTP-Referer": "https://your-app.com",  # requerido por OpenRouter
    }
)
```

### 3.2 Agent Worker con OpenRouter

```python
import openai
import requests
import json

BOARD_URL = "http://localhost:3000"

client = openai.OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-v1-YOUR_KEY",
    default_headers={"HTTP-Referer": "https://agentboard.local"},
)

# Reusar las mismas agentboard_tools y execute_tool() de la sección 2.3

def run_openrouter_agent(model, agent_id, task_description=None):
    """
    Ejecuta un agente usando cualquier modelo de OpenRouter.

    Modelos recomendados:
      - anthropic/claude-sonnet-4-5-20250929   (Claude Sonnet 4.5)
      - openai/gpt-4o                          (GPT-4o)
      - google/gemini-2.5-pro                  (Gemini 2.5 Pro)
      - meta-llama/llama-3.1-405b-instruct     (Llama 3.1 405B)
    """
    system_prompt = f"""You are {agent_id}, an AI agent worker.
You interact with AgentBoard to manage your tasks.

Workflow:
1. Check your assigned tasks with list_tasks
2. Pick a task and move it to IN_PROGRESS
3. Do the work (describe what you would do)
4. Add evidence of your work
5. Request review when done
6. If rejected, read the review comments and iterate

Always update the board as you work."""

    user_msg = task_description or "Check the board and work on your next assigned task."

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg},
    ]

    for _ in range(10):  # max 10 tool-call rounds
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=agentboard_tools,
        )

        choice = response.choices[0]

        if choice.finish_reason == "stop":
            print(f"[{model}] Agent done: {choice.message.content}")
            break

        if choice.message.tool_calls:
            messages.append(choice.message)
            for tc in choice.message.tool_calls:
                args = json.loads(tc.function.arguments)
                print(f"[{model}] Calling {tc.function.name}({json.dumps(args)})")
                result = execute_tool(tc.function.name, args)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(result),
                })
        else:
            print(f"[{model}] {choice.message.content}")
            break


# --- Ejemplo: múltiples agentes con distintos modelos ---
if __name__ == "__main__":
    # Claude trabaja en backend
    run_openrouter_agent(
        model="anthropic/claude-sonnet-4-5-20250929",
        agent_id="agent-claude-backend",
    )

    # GPT trabaja en frontend
    run_openrouter_agent(
        model="openai/gpt-4o",
        agent_id="agent-gpt-frontend",
    )

    # Gemini como QA
    run_openrouter_agent(
        model="google/gemini-2.5-pro",
        agent_id="agent-antigravity-qa",
        task_description="Run QA checks on all tasks in REVIEW status",
    )
```

### 3.3 Patrón Avanzado: Orquestador Multi-Agente

Para ejecutar múltiples agentes en paralelo, cada uno con un modelo diferente via OpenRouter:

```python
import asyncio
import aiohttp
import json

BOARD_URL = "http://localhost:3000"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_KEY = "sk-or-v1-YOUR_KEY"

AGENT_CONFIG = [
    {"agent_id": "agent-claude-backend",    "model": "anthropic/claude-sonnet-4-5-20250929", "role": "backend"},
    {"agent_id": "agent-gpt-frontend",      "model": "openai/gpt-4o",                       "role": "frontend"},
    {"agent_id": "agent-antigravity-qa",    "model": "google/gemini-2.5-pro",                "role": "qa"},
]


async def execute_tool_async(session, name, args):
    """Async version of execute_tool"""
    if name == "list_tasks":
        params = {k: v for k, v in args.items() if v}
        async with session.get(f"{BOARD_URL}/api/tasks", params=params) as r:
            return await r.json()
    elif name == "update_task_status":
        async with session.patch(
            f"{BOARD_URL}/api/tasks/{args['task_id']}/status",
            json={"status": args["status"], "comment": args.get("comment")}
        ) as r:
            return await r.json()
    elif name == "add_evidence":
        payload = {k: v for k, v in args.items() if k != "task_id" and v}
        async with session.post(
            f"{BOARD_URL}/api/tasks/{args['task_id']}/evidence", json=payload
        ) as r:
            return await r.json()
    elif name == "request_review":
        async with session.post(
            f"{BOARD_URL}/api/tasks/{args['task_id']}/review-request"
        ) as r:
            return await r.json()


async def run_agent(session, config):
    """Ejecuta un agente worker en loop"""
    messages = [
        {"role": "system", "content": f"You are {config['agent_id']} ({config['role']}). Use your tools to check AgentBoard for tasks and work on them."},
        {"role": "user", "content": "Check the board and work on your assigned tasks."},
    ]

    for _ in range(10):
        async with session.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_KEY}",
                "HTTP-Referer": "https://agentboard.local",
            },
            json={"model": config["model"], "messages": messages, "tools": agentboard_tools}
        ) as r:
            data = await r.json()

        choice = data["choices"][0]
        if choice["finish_reason"] == "stop":
            print(f"[{config['agent_id']}] Done.")
            break

        msg = choice["message"]
        if msg.get("tool_calls"):
            messages.append(msg)
            for tc in msg["tool_calls"]:
                args = json.loads(tc["function"]["arguments"])
                print(f"[{config['agent_id']}] → {tc['function']['name']}")
                result = await execute_tool_async(session, tc["function"]["name"], args)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": json.dumps(result),
                })


async def main():
    async with aiohttp.ClientSession() as session:
        await asyncio.gather(*[run_agent(session, cfg) for cfg in AGENT_CONFIG])


asyncio.run(main())
```

---

## Referencia Rápida: API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Listar tareas (`?status=`, `?agent_id=`, `?project=`) |
| `POST` | `/api/tasks` | Crear tarea |
| `GET` | `/api/tasks/:id` | Obtener tarea |
| `PATCH` | `/api/tasks/:id` | Editar campos (title, description, tags, agentId) |
| `DELETE` | `/api/tasks/:id` | Eliminar tarea |
| `PATCH` | `/api/tasks/:id/status` | Cambiar estado (valida transiciones) |
| `POST` | `/api/tasks/:id/evidence` | Adjuntar evidencia |
| `POST` | `/api/tasks/:id/review-request` | Solicitar review humano |
| `POST` | `/api/tasks/:id/review-response` | Aprobar/rechazar (`{decision, comment}`) |
| `POST` | `/api/tasks/:id/comments` | Agregar comentario |
| `GET` | `/api/agents` | Listar agentes |
| `GET` | `/api/projects` | Listar proyectos |

## Transiciones de Estado Válidas

```
BACKLOG ──→ ASSIGNED ──→ IN_PROGRESS ──→ REVIEW ──→ APPROVED ──→ DONE
  ↑             │              │             │
  └─────────────┘              │         REJECTED
                               │             │
                               └─────────────┘
```

## Tipos de Evidencia

| Tipo | Uso |
|------|-----|
| `SCREENSHOT` | Capturas de pantalla |
| `LOG` | Salida de tests, builds, comandos |
| `FILE` | Referencia a archivos |
| `PR_LINK` | Link a Pull Request |
| `CUSTOM` | Cualquier otro tipo |
