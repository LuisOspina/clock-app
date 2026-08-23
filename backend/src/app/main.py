from fastapi import FastAPI

app = FastAPI(title="Clock API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}