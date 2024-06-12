'use strict'

import { parentPort } from 'worker_threads'


/* JOB */
let increment = 0
while (increment !== Math.pow(10, 10)) {
  increment++
}

const message = 'Intensive CPU task is done ! Result is : ' + increment
parentPort.postMessage(message)