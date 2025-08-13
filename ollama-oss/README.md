
# Start

run ollama docker image and the docker compose file for postgress(memory setup) ad n8n(automation tool)

```bash
# if need to run local models
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
docker exec -it ollama ollama pull gpt-oss:20b
docker exec -it ollama ollama pull llama3
docker exec -it ollama ollama pull llama3.2:3b
docker exec -it ollama ollama pull gemma3:4b

cd operations
docker compose up -d
```
