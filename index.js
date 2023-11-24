let model;
let recognizer;

async function initializeSpeechRecognition() {
    const statusContainer = document.getElementById('status');
    const partialContainer = document.getElementById('partial');
    const resultsContainer = document.getElementById('recognition-result');

    statusContainer.textContent = 'Loading...';

    model = await Vosk.createModel('Audio-Visualization-and-Speech-Recognition/model/vosk-model-small-en-in-0.4.zip');
    recognizer = new model.KaldiRecognizer();
    recognizer.on("result", (message) => {
        const result = message.result;
        const newSpan = document.createElement('div');
        newSpan.classList = 'mt-2 mb-4 transcriptPhrase';
        newSpan.innerHTML = `<span class="bg-light rounded py-2 px-3 mr-3 mt-2 mb-2">${result.text}</span>`;
        resultsContainer.insertBefore(newSpan, partialContainer);
    });
    recognizer.on("partialresult", (message) => {
        const partial = message.result.partial;
        partialContainer.textContent = partial;
    });

    statusContainer.textContent = 'Select a audio file to visualize and transcribe';
}

const recognize = async ({ target: { files } }) => {
    const fileUrl = URL.createObjectURL(files[0]);
    const audioGrabber = document.getElementById('audio-grabber');
    audioGrabber.src = fileUrl;
    audioGrabber.onerror = function() {
        alert('Invalid audio file. Please select a valid audio file.') ? "" : location.reload();
        return;
    };
    load_wavesurfer(fileUrl);

    const audioContext = new AudioContext();
    const recognizerNode = audioContext.createScriptProcessor(4096, 1, 1)
    recognizerNode.onaudioprocess = (event) => {
        try {
            if ((audioGrabber.currentTime < audioGrabber.duration) && !audioGrabber.paused) {
                recognizer.acceptWaveform(event.inputBuffer)
            }
        } catch (error) {
            console.error('acceptWaveform failed', error)
        }
    }
    const audioSource = audioContext.createMediaElementSource(audioGrabber);
    audioSource.connect(recognizerNode);
    recognizerNode.connect(audioContext.destination);
}

async function load_wavesurfer(fileUrl) {
    document.getElementById('waveform').innerHTML = '';
    document.querySelectorAll('.transcriptPhrase').forEach(el => el.remove());
    // Create WaveSurfer
    wavesurfer = WaveSurfer.create({
        container: document.querySelector('#waveform'),
        barWidth: 4,
        barRadius: 4,
        height: 200,
        backend: 'MediaElement',
        mediaControls: true,
        mediaType: 'audio',
        responsive: true,
        hideScrollbar: false,
        scrollParent: true
    });
    wavesurfer.load(fileUrl);

    wavesurfer.on('error', function () {
        alert('Invalid audio file. Please select a valid audio file.') ? "" : location.reload();
    });

    wavesurfer.on('ready', function () {
        document.getElementById('waveform').style.display = 'block';
        document.getElementById('transcriptContainer').style.display = 'block';
        recognizer.on("partialresult", (message) => {
            if ($('.transcriptPhrase').length < 1) {
                wavesurfer.play();
            }
            $(".transcriptbody").scrollTop($(".transcriptbody")[0].scrollHeight);
        });
    });
}

window.onload = () => {
    document.getElementById('fileUpload').disabled = true;
    initializeSpeechRecognition();
    document.getElementById('fileUpload').disabled = false;
    document.getElementById('fileUpload').addEventListener('change', recognize);
}