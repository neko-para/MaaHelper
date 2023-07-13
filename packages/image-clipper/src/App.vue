<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const drawEl = ref<HTMLCanvasElement | null>(null)

let image: HTMLImageElement | null = null

const canvasWidth = ref(0)
const canvasHeight = ref(0)

const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

const pointerX = ref(0)
const pointerY = ref(0)

const trackXY = ref<[number, number] | null>(null)
const trackEndXY = ref<[number, number] | null>(null)

const cropSize = computed<[number, number, number, number] | null>(() => {
  if (!trackXY.value || !trackEndXY.value) {
    return null
  }
  let x = (trackXY.value[0] - offsetX.value) / scale.value
  let y = (trackXY.value[1] - offsetY.value) / scale.value
  let w = (trackEndXY.value[0] - trackXY.value[0]) / scale.value
  let h = (trackEndXY.value[1] - trackXY.value[1]) / scale.value
  if (w < 0) {
    w = -w
    x -= w
  }
  if (h < 0) {
    h = -h
    y -= h
  }
  return [x, y, w, h]
})

const dragOffset = ref<[number, number] | null>(null)
const dragXY = ref<[number, number] | null>(null)

onMounted(() => {
  const el = drawEl.value
  if (!el) {
    return
  }
  const ctx = el.getContext('2d')
  if (!ctx) {
    return
  }

  function doScale(rate: number) {
    if (trackXY.value && !trackEndXY.value) {
      return
    }

    trackXY.value = null
    trackEndXY.value = null

    const news = scale.value * rate

    const dx =
      pointerX.value - (pointerX.value - offsetX.value) * rate - offsetX.value
    const dy =
      pointerY.value - (pointerY.value - offsetY.value) * rate - offsetY.value

    scale.value = news
    offsetX.value += dx
    offsetY.value += dy
  }

  window.onkeydown = e => {
    if (e.key === '=') {
      doScale(1.1)
    } else if (e.key === '-') {
      doScale(1 / 1.1)
    }
  }

  el.onwheel = e => {
    if (e.deltaY < 0) {
      doScale(1.1)
    } else {
      doScale(1 / 1.1)
    }
  }

  el.onpointerdown = e => {
    if (e.button === 0) {
      trackXY.value = [pointerX.value, pointerY.value]
      trackEndXY.value = null
      el.setPointerCapture(e.pointerId)
    } else if (e.button === 1) {
      dragOffset.value = [offsetX.value, offsetY.value]
      dragXY.value = [pointerX.value, pointerY.value]
      el.setPointerCapture(e.pointerId)
    }
  }

  el.onpointerup = e => {
    if (e.button === 0) {
      const track = trackXY.value
      if (!track) {
        return
      }
      const trackEnd: [number, number] = [pointerX.value, pointerY.value]
      el.releasePointerCapture(e.pointerId)
      if (trackEnd[0] === track[0] || trackEnd[1] === track[1]) {
        trackXY.value = null
      } else {
        trackEndXY.value = trackEnd
      }
    } else if (e.button === 1) {
      if (!dragXY.value) {
        return
      }
      el.releasePointerCapture(e.pointerId)
      dragOffset.value = null
      dragXY.value = null
    }
  }

  el.onpointermove = e => {
    const imw = scale.value * 1280
    const imh = scale.value * 720
    let dx = 0
    let dy = 0
    if (canvasWidth.value >= imw) {
      dx = (canvasWidth.value - imw) / 2
    }
    if (canvasHeight.value >= imh) {
      dy = (canvasHeight.value - imh) / 2
    }
    const x = Math.round(
      Math.min(Math.max(dx, e.offsetX), canvasWidth.value - dx)
    )
    const y = Math.round(
      Math.min(Math.max(dy, e.offsetY), canvasHeight.value - dy)
    )
    pointerX.value = x
    pointerY.value = y

    const xy = dragXY.value
    const ofs = dragOffset.value
    if (!xy || !ofs) {
      return
    }
    offsetX.value = pointerX.value - xy[0] + ofs[0]
    offsetY.value = pointerY.value - xy[1] + ofs[1]
  }

  function fixPos() {
    const imw = scale.value * 1280
    const imh = scale.value * 720
    if (canvasWidth.value >= imw) {
      offsetX.value = (canvasWidth.value - imw) / 2
    } else {
      if (offsetX.value + imw < canvasWidth.value) {
        offsetX.value = canvasWidth.value - imw
      } else if (offsetX.value > 0) {
        offsetX.value = 0
      }
    }
    if (canvasHeight.value >= imh) {
      offsetY.value = (canvasHeight.value - imh) / 2
    } else {
      if (offsetY.value + imh < canvasHeight.value) {
        offsetY.value = canvasHeight.value - imh
      } else if (offsetY.value > 0) {
        offsetY.value = 0
      }
    }
  }

  const render = () => {
    fixPos()

    ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
    if (image) {
      ctx.drawImage(
        image,
        offsetX.value,
        offsetY.value,
        scale.value * 1280,
        scale.value * 720
      )
    }

    if (trackXY.value) {
      const begXY = trackXY.value
      const endXY = trackEndXY.value ?? [pointerX.value, pointerY.value]
      const selRect = new Path2D()
      selRect.rect(begXY[0], begXY[1], endXY[0] - begXY[0], endXY[1] - begXY[1])
      const fullRect = new Path2D()
      fullRect.rect(0, 0, canvasWidth.value, canvasHeight.value)
      ctx.save()
      ctx.clip(selRect)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.fill(fullRect)
      ctx.restore()
    }
  }

  setInterval(render, 100)

  window.addEventListener('resize', () => {
    canvasWidth.value = el.width = el.clientWidth
    canvasHeight.value = el.height = el.clientHeight
  })
  canvasWidth.value = el.width = el.clientWidth
  canvasHeight.value = el.height = el.clientHeight
})

addEventListener('message', event => {
  const data = event.data as {
    action: string
    [other: string]: string
  }
  switch (data.action) {
    case 'push-image': {
      const img = new Image()
      img.onload = () => {
        image = img
      }
      img.src = `data:image/png;base64,${data.image}`
      break
    }
  }
})

const vscode = acquireVsCodeApi()

function requireNew() {
  vscode.postMessage({
    action: 'pull-image'
  })
}

function requireSave() {
  if (!trackEndXY.value || !trackXY.value) {
    return
  }
  const [x, y, w, h] = cropSize.value ?? [0, 0, 0, 0]
  vscode.postMessage({
    action: 'save-image',
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(w),
    h: Math.round(h)
  })
}
</script>

<template>
  <div class="w-full h-full flex flex-col gap-2">
    <div class="flex gap-2 items-center">
      <vscode-button @click="requireNew">Pull</vscode-button>
      <vscode-button @click="requireSave">Slice</vscode-button>
      <span>{{ cropSize }}</span>
    </div>
    <div class="flex-1 relative">
      <canvas
        class="absolute left-0 top-0 w-full h-full"
        id="draw"
        ref="drawEl"
      ></canvas>
    </div>
    <div class="flex gap-2 items-center">
      <div class="grid grid-cols-3 gap-2">
        <span> {{ `Cursor: (${pointerX},${pointerY})` }} </span>
        <span v-if="trackXY">
          {{ `TrackBegin: (${trackXY[0]},${trackXY[1]})` }}
        </span>
        <span v-else> TrackBegin: / </span>
        <span v-if="trackEndXY">
          {{ `TrackEnd: (${trackEndXY[0]},${trackEndXY[1]})` }}
        </span>
        <span v-else> TrackEnd: / </span>
      </div>
    </div>
  </div>
</template>
