function buildImage(buffer, video, ar_img) {

  const ctx = buffer.getContext("2d");

  const vW = video.videoWidth;
  const vH = video.videoHeight;
  const renderWidth = buffer.height * vW / vH;
  const x = (buffer.width - renderWidth) / 2;
  ctx.drawImage(video, x, 0, renderWidth,  buffer.height);

  ctx.drawImage(ar_img, 0, 0, buffer.width, buffer.height);

  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';

  ctx.save();
    
    ctx.globalCompositeOperation='difference';
    
    ctx.translate(16, 16);
    ctx.rotate(Math.PI / 2);
    
    ctx.font = '22px "ark"';
    ctx.fillText('carnaval digital-pirate', 0, 0);

    ctx.translate(0, -28);

    ctx.font = '48px "ark"';
    ctx.fillText('CONTACTS', 0, 0);

  ctx.restore();

  ctx.drawImage(qr_code, buffer.width - 64 - 16, buffer.height - 64 - 16, 64, 64);
}

var qr_code = new Image
qr_code.src = './scan_reference.png'

function screenshot() {
  const video = document.querySelector("video");
  const ar_data = document.querySelector("canvas");
  var ar_img = new Image;

  const buffer = document.createElement("canvas");
  buffer.width = ar_data.offsetWidth;
  buffer.height = ar_data.offsetHeight;

  ar_img.addEventListener('load', () => {

    buildImage(buffer, video, ar_img);

    const data = buffer.toDataURL("image/png");
    document.getElementById("overlay").classList.add("active");
    document.getElementById("image-screenshot").src = data;

    const link = document.getElementById("download");
    link.onclick = function() {
      const a = document.createElement("a");
      a.href = data;
      a.download = "screenshot.png";
      a.click();  
    }
  });

  ar_img.src = ar_data.toDataURL("image/png");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("take-screenshot").addEventListener("click", screenshot)  
  document.getElementById("retry").addEventListener("click", () => {
    document.getElementById("overlay").classList.remove("active");
  });  
})
