// Core Reader Logic — Black Dollar Trust Book Club

const bookInput = document.getElementById("bookInput");
const uploadBtn = document.getElementById("uploadBtn");
const bookPreview = document.getElementById("bookPreview");
const bookName = document.getElementById("bookName");
const voiceSelect = document.getElementById("voiceSelect");

const readBtn = document.getElementById("readBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");

let synth = window.speechSynthesis;
let currentUtterance = null;
let currentText = "";

// Load Voices
function loadVoices() {
  const voices = synth.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach(voice => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}
loadVoices();
if (speechSynthesis.onvoiceschanged !== undefined)
  speechSynthesis.onvoiceschanged = loadVoices;

// Upload Book
uploadBtn.onclick = () => {
  const file = bookInput.files[0];
  if (!file) return alert("Please select a book file first.");

  bookName.textContent = `📘 ${file.name}`;
  const reader = new FileReader();

  // TXT
  if (file.name.endsWith(".txt")) {
    reader.onload = e => {
      currentText = e.target.result;
      bookPreview.textContent = currentText.slice(0, 2000);
    };
    reader.readAsText(file);
  }

  // PDF
  else if (file.name.endsWith(".pdf")) {
    reader.onload = async e => {
      const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(it => it.str).join(" ") + "\n";
      }
      currentText = text;
      bookPreview.textContent = text.slice(0, 2000);
    };
    reader.readAsArrayBuffer(file);
  }

  // EPUB
  else if (file.name.endsWith(".epub")) {
    reader.onload = e => {
      const book = ePub(e.target.result);
      book.ready.then(() => {
        book.loaded.metadata.then(meta => {
          bookPreview.textContent = `📖 ${meta.title}\nby ${meta.creator}`;
        });
        book.loaded.navigation.then(nav => {
          book.section(0).render().then(output => {
            currentText = output;
            bookPreview.textContent += "\n\n" + output.slice(0, 2000);
          });
        });
      });
    };
    reader.readAsArrayBuffer(file);
  }
};

// Text-to-Speech Controls
readBtn.onclick = () => {
  if (!currentText) return alert("No text available to read.");

  if (synth.speaking) synth.cancel();

  currentUtterance = new SpeechSynthesisUtterance(currentText);
  currentUtterance.voice = synth.getVoices().find(v => v.name === voiceSelect.value);
  currentUtterance.rate = 1.0;
  currentUtterance.pitch = 1.0;
  synth.speak(currentUtterance);
};

pauseBtn.onclick = () => synth.pause();
stopBtn.onclick = () => synth.cancel();
