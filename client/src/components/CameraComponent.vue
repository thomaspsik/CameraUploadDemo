<script setup>
import { onMounted, ref, watchEffect } from 'vue';
import { useDevicesList, useUserMedia } from '@vueuse/core';
import axios from 'axios';

const currentCamera = ref(); // camera selected by user
const video = ref(); // stream from camera
const canvas = ref(null); // drawable
const photo = ref(); // image taken
const filename = ref(); // var for filename by user
const message = ref(); // to display message from server on successful post
const isPicTaken = ref(false); // is there an image to be send to the server

let width = 0; // is set in callback, when stream starts
let height = 0; // is set in callback, when stream starts

const { videoInputs: cameras } = useDevicesList({
  requestPermissions: true,
  onUpdated() {
    if (!cameras.value.find((i) => i.deviceId === currentCamera.value))
      currentCamera.value = cameras.value[0]?.deviceId;
  },
});

const { stream, enabled } = useUserMedia({
  constraints: { video: { deviceId: currentCamera } },
});

// function from vue
// see https://vuejs.org/api/reactivity-core.html#watcheffect
// is called when stream is changed: eg. camera is changed or stream is started
watchEffect(() => {
  if (video.value) video.value.srcObject = stream.value;
});

onMounted(() => {
  // add eventlistener, which is called when the stream is started
  // get width / height - from the stream
  video.value.addEventListener(
    'loadedmetadata',
    function () {
      (width = this.videoWidth), (height = this.videoHeight);
      // console.log(width, height);
    },
    false,
  );
  // if there is an image in the localStore,
  // load it from the localStore
  // Techdemo: how to store in and read from an image from the localStorage
  const oldPic = localStorage.getItem('oldpic');
  if (oldPic) {
    photo.value = oldPic;
  }
});

// reset the image
// is called when "take image" is called without an active stream
function clearphoto() {
  if (canvas.value == null) return;

  const context = canvas.value.getContext('2d');
  context.fillStyle = '#AAA';
  context.fillRect(0, 0, canvas.value.width, canvas.value.height);

  const data = canvas.value.toDataURL('image/png');
  photo.value = data;
}

// function to store the current frame
function takepicture() {
  const context = canvas.value.getContext('2d');
  if (width && height) {
    canvas.value.width = width;
    canvas.value.height = height;
    context.drawImage(video.value, 0, 0, width, height);

    const data = canvas.value.toDataURL('image/png'); // store png format
    isPicTaken.value = true;
    localStorage.setItem('oldpic', data);
  } else {
    clearphoto();
    localStorage.removeItem('oldpic');
    isPicTaken.value = false;
  }
}

// upload the taken image to the server
async function uploadPicture() {
  const imageDataURL = canvas.value.toDataURL('image/jpeg'); // upload jpg format - no particular reason for that
  const ret = await axios.post('http://localhost:3000/upload-image', { image: imageDataURL, filename: filename.value });
  message.value = ret.data;
}
</script>

<template>
  <div class="flex flex-col gap-4 text-center container">
    <div>
      <h2>Select Camera => Press Start => Take picture => Upload picture to server</h2>
    </div>

    <div>
      <div
        v-for="camera of cameras"
        :key="camera.deviceId"
        class="px-2 py-1 cursor-pointer"
        :class="{ 'text-primary': currentCamera === camera.deviceId }"
        @click="currentCamera = camera.deviceId">
        {{ camera.label }}
      </div>

      <button @click="enabled = !enabled">
        {{ enabled ? 'Stop' : 'Start' }}
      </button>
    </div>
    <div>
      <div>
        <video ref="video" muted autoplay controls class="h-100 w-auto" />
        <div><button @click="takepicture">Take picture</button><br /></div>
      </div>
      <div>
        <h2>Picture taken now:</h2>
        <canvas ref="canvas"> </canvas>
        <div v-show="isPicTaken">
          <input type="text" placeholder="filename" v-model="filename" />
          <button @click="uploadPicture">Upload picture</button><br />
          <span v-show="message">Message from server: {{ message }}</span>
        </div>
      </div>
    </div>
    <!-- drawable dom element-->
    <div>
      <h2>Picture before (local storage):</h2>
      <img :src="photo" alt="The screen capture will appear in this box." />
    </div>
  </div>
</template>
