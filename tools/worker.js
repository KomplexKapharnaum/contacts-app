// Genworker class

const { Worker } = require('worker_threads')



class Genworker {
    constructor(workername) {
        this.workername = workername.toLowerCase()
        this.worker = null
    }

    run() 
    {
        return new Promise((resolve, reject) => {
            this.worker = new Worker(`./workers/${this.workername}.js`)
            this.worker.on('message', resolve)
            this.worker.on('error', reject)
            this.worker.on('exit', (code) => {
                if (code !== 0)
                    reject(new Error(`Worker stopped with exit code ${code}`))
            })
        })
    }

    stop() 
    {
        this.worker.terminate()
    }

    isRunning() 
    {
        return this.worker && this.worker.threadId !== undefined
    }

    wait(ms) 
    {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}