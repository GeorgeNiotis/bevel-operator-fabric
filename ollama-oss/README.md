
# Start

run ollama docker image and the docker compose file for postgress(memory setup) ad n8n(automation tool)

```bash
# if need to run local models
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
docker exec -it ollama ollama run gpt-oss:20b
docker exec -it ollama ollama run llama3
docker exec -it ollama ollama run llama3.2:3b



cd operations
docker compose up -d
```
