from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from integrations.dotenv_loader import load_local_env
from integrations.providers import provider_status, starter_env_map

load_local_env()


class HealthResponse(BaseModel):
    status: str
    service: str


class IdeaRequest(BaseModel):
    problem: str
    audience: str | None = None
    differentiator: str | None = None


class IdeaResponse(BaseModel):
    summary: str
    next_steps: list[str]


class ProviderStatusResponse(BaseModel):
    providers: dict


class StarterConfigResponse(BaseModel):
    config: dict


app = FastAPI(title="Hackathon Starter API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service="hackathon-starter-api")


@app.post("/api/idea", response_model=IdeaResponse)
async def refine_idea(payload: IdeaRequest) -> IdeaResponse:
    audience = payload.audience or "a clear target user"
    differentiator = payload.differentiator or "one obvious reason this product wins"

    return IdeaResponse(
        summary=f"Build a product that solves '{payload.problem}' for {audience}, centered on {differentiator}.",
        next_steps=[
            "Write the one-sentence value proposition.",
            "Define the single most important user flow.",
            "Build the landing page and CTA first.",
            "Implement one demo-worthy backend endpoint.",
            "Prepare a short story for the judges: problem, solution, traction signal.",
        ],
    )


@app.get("/api/providers", response_model=ProviderStatusResponse)
async def providers() -> ProviderStatusResponse:
    return ProviderStatusResponse(providers=provider_status())


@app.get("/api/starter-config", response_model=StarterConfigResponse)
async def starter_config() -> StarterConfigResponse:
    return StarterConfigResponse(config=starter_env_map())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
