import { writeFile } from "fs/promises"
import { join } from "path"
import WebSocket from "ws"
import fs from "fs"

export class ComfyUIClient {
  constructor(serverAddress, useSSL=false, clientId="webapp", loglevel="info") {
    this.serverAddress = serverAddress
    this.useSSL = true
    this.clientId = clientId
    this.loglevel = loglevel
  }

  log(level, ...args) {
    if (this.loglevel === "none") {
      return
    }

    if (level === "debug" && this.loglevel === "info") {
      return
    }

    if (level === "info" && this.loglevel === "error") {
      return
    }

    if (level === "error") {
      console.error(...args)
    } else {
      console.log(...args)
    }
  }

  connect() {
    return new Promise(async (resolve,reject) => {
      if (this.ws) {
        await this.disconnect()
      }

      const url = `ws${this.useSSL ? 's' : ''}://${this.serverAddress}/ws?clientId=${this.clientId}`

      this.log('info', `Connecting to url: ${url}`)

      this.ws = new WebSocket(url, {
        perMessageDeflate: false
      })

      this.ws.on("open", () => {
        this.log('info', "Connection open")
        resolve()
      })

      this.ws.on("close", () => {
        this.log('info', "Connection closed")
      })

      this.ws.on("error", err => {
        this.log('error', { err }, "WebSockets error")
        reject(err)
      })

      this.ws.on("message", (data, isBinary) => {
        if (isBinary) {
          this.log('debug', "Received binary data")
        } else {
          this.log('debug', "Received data: %s", data.toString())
        }
      })
    })
  }

  async disconnect() {
    if (this.ws) {
      await this.ws.close()
      this.ws = undefined
    }
  }

  async getEmbeddings() {
    const res = await fetch(`http${this.useSSL ? 's' : ''}://${this.serverAddress}/embeddings`)

    const json = await res.json()

    if ("error" in json) {
      throw new Error(JSON.stringify(json))
    }

    return json
  }

  async getExtensions() {
    const res = await fetch(`http${this.useSSL ? 's' : ''}://${this.serverAddress}/extensions`)

    const json = await res.json()

    if ("error" in json) {
      throw new Error(JSON.stringify(json))
    }

    return json
  }

  async queuePrompt(prompt) {
    const res = await fetch(`http${this.useSSL ? 's' : ''}://${this.serverAddress}/prompt`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        client_id: this.clientId
      })
    })

    const json = await res.json()

    if ("error" in json) {
      throw new Error(JSON.stringify(json))
    }

    return json
  }

  async interrupt() {
    const res = await fetch(`http${this.useSSL ? 's' : ''}://${this.serverAddress}/interrupt`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    })

    const json = await res.json()

    if ("error" in json) {
      throw new Error(JSON.stringify(json))
    }
  }

  async editHistory(params) {
    const res = await fetch(`http${this.useSSL ? 's' : ''}://${this.serverAddress}/history`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params)
    })

    const json = await res.json()

    if ("error" in json) {
      throw new Error(JSON.stringify(json))
    }
  }

  async uploadImage(path, filename) {
    const formData = new FormData()

    // load blob from local file
    const data = fs.readFileSync(path)

    // append blob to formdata
    formData.append("image", new Blob([data]), filename)
    formData.append("overwrite", "true")

    const res = await fetch(`http${this.useSSL ? 's' : ''}://${this.serverAddress}/upload/image`, {
      method: "POST",
      body: formData
    })

    const json = await res.json()
    if ("error" in json) {
      throw new Error(JSON.stringify(json))
    }

    return json
  }

  async uploadMask(image, filename, originalRef, overwrite) {
    const formData = new FormData()
    formData.append("image", new Blob([image]), filename)
    formData.append("originalRef", JSON.stringify(originalRef))

    if (overwrite !== undefined) {
      formData.append("overwrite", overwrite.toString())
    }

    const res = await fetch(`http${this.useSSL ? 's' : ''}://${this.serverAddress}/upload/mask`, {
      method: "POST",
      body: formData
    })

    const json = await res.json()

    if ("error" in json) {
      throw new Error(JSON.stringify(json))
    }

    return json
  }

  async getImage(filename, subfolder, type) {
    const res = await fetch(
      `http${this.useSSL ? 's' : ''}://${this.serverAddress}/view?` +
        new URLSearchParams({
          filename,
          subfolder,
          type
        })
    )

    const blob = await res.blob()
    return blob
  }

  async viewMetadata(folderName, filename) {
    const res = await fetch(
      `http${this.useSSL ? 's' : ''}://${this.serverAddress}/view_metadata/${folderName}?filename=${filename}`
    )

    const json = await res.json()

    if ("error" in json) {
      throw new Error(JSON.stringify(json))
    }

    return json
  }

  async getSystemStats() {
    const res = await fetch(`http${this.useSSL ? 's' : ''}://${this.serverAddress}/system_stats`)

    const json = await res.json()

    if ("error" in json) {
      throw new Error(JSON.stringify(json))
    }

    return json
  }

  async getPrompt() {
    const res = await fetch(`http${this.useSSL ? 's' : ''}://${this.serverAddress}/prompt`)

    const json = await res.json()

    if ("error" in json) {
      throw new Error(JSON.stringify(json))
    }

    return json
  }

  async getObjectInfo(nodeClass) {
    const res = await fetch(
      `http${this.useSSL ? 's' : ''}://${this.serverAddress}/object_info` +
        (nodeClass ? `/${nodeClass}` : "")
    )

    const json = await res.json()

    if ("error" in json) {
      throw new Error(JSON.stringify(json))
    }

    return json
  }

  async getHistory(promptId) {
    const res = await fetch(
      `http${this.useSSL ? 's' : ''}://${this.serverAddress}/history` + (promptId ? `/${promptId}` : "")
    )

    const json = await res.json()

    if ("error" in json) {
      throw new Error(JSON.stringify(json))
    }

    return json
  }

  async getQueue() {
    const res = await fetch(`http${this.useSSL ? 's' : ''}://${this.serverAddress}/queue`)

    const json = await res.json()

    if ("error" in json) {
      throw new Error(JSON.stringify(json))
    }

    return json
  }

  async saveImages(response, outputDir) {
    if (!response) return
    for (const filename of Object.keys(response)) {
        const arrayBuffer = await response[filename].arrayBuffer()
        const outputPath = join(outputDir, filename)
        await writeFile(outputPath, Buffer.from(arrayBuffer))
    }
  }

  async saveImage(blob, outputDir, filename) {
    const arrayBuffer = await blob.arrayBuffer()
    const outputPath = join(outputDir, filename)
    await writeFile(outputPath, Buffer.from(arrayBuffer))
  }

  getImages(response, filename) {
    const images = {}
    let i=0
    if (!response || !response.outputs) return images
    for (const nodeId of Object.keys(response.outputs)) {
      if (Array.isArray(response.outputs[nodeId])) {
        for (const img of response.outputs[nodeId]) {
          if (img.blob) {
            images[`${filename}_${i}.png`] = img.blob
            console.log(`${filename}_${i}.png`)
            i++
          }
        }
      }
    }
    return images
  }

  async runPrompt(prompt) {
    if (!this.ws) {
      throw new Error(
        "WebSocket client is not connected. Please call connect() before interacting."
      )
    }

    const queue = await this.queuePrompt(prompt)
    const promptId = queue.prompt_id

    return new Promise((resolve, reject) => {
      const outputImages = {}

      const onMessage = async (data, isBinary) => {
        // Previews are binary data
        if (isBinary) {
          return
        }

        try {
          const message = JSON.parse(data.toString())
          if (message.type === "executing") {
            const messageData = message.data
            if (!messageData.node) {
              const donePromptId = messageData.prompt_id

              this.log('info', `Done executing prompt (ID: ${donePromptId})`)

              // Execution is done
              if (messageData.prompt_id === promptId) {
                // Get history
                const historyRes = await this.getHistory(promptId)
                const history = historyRes[promptId]

                // Populate output images
                for (const nodeId of Object.keys(history.outputs)) {
                  const nodeOutput = history.outputs[nodeId]
                  if (nodeOutput.images) {
                    const imagesOutput = []
                    for (const image of nodeOutput.images) {
                      const blob = await this.getImage(
                        image.filename,
                        image.subfolder,
                        image.type
                      )
                      imagesOutput.push({
                        blob,
                        image
                      })
                    }
                    history.outputs[nodeId] = imagesOutput
                  }
                }

                // Remove listener
                this.ws?.off("message", onMessage)
                return resolve(history)
              }
            }
          }
        } catch (err) {
          return reject(err)
        }
      }

      // Add listener
      this.ws?.on("message", onMessage)
    })
  }
}
