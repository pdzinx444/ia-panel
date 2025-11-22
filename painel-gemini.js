(function(){
  if (document.getElementById("painel-gemini")) return; // evita múltiplos

  const painel = document.createElement("div");
  painel.innerHTML = `
<style>
#painel-gemini{position:fixed;bottom:20px;right:20px;width:320px;max-height:520px;padding:15px;background:#1e1e1e;color:#f0f0f0;font-family:sans-serif;border-radius:10px;box-shadow:0 0 10px #000;z-index:9999;overflow-y:auto}
#painel-gemini input,#painel-gemini textarea{width:100%;box-sizing:border-box;padding:8px;margin-bottom:10px;border-radius:5px;border:none;color:#000 !important}
#painel-gemini button{width:100%;padding:8px;border:none;border-radius:5px;background-color:#4caf50;color:#fff;cursor:pointer;font-weight:700}
#painel-gemini #resposta{margin-top:10px;white-space:pre-wrap;background:#2a2a2a;padding:10px;border-radius:5px}
#painel-gemini a{color:#4fc3f7;text-decoration:none;font-size:12px}
#painel-gemini label{font-size:14px;margin-bottom:5px;display:block;color:#fff}
#apikey{color:#4caf50!important}
#btn-esconder{position:absolute!important;top:8px!important;right:10px!important;background:none!important;border:none!important;color:#fff!important;font-size:12px!important;cursor:pointer!important;padding:2px 4px!important;width:auto!important}
#btn-toggle{position:fixed;bottom:20px;right:20px;background:#000;color:#fff;border:none;border-radius:50%;width:36px;height:36px;font-size:16px;cursor:pointer;display:none;justify-content:center;align-items:center;z-index:9999}
#imagem-preview {max-width:100%; display:none; margin-bottom:10px; border-radius:5px;}
</style>
<div id="painel-gemini">
  <button id="btn-esconder">esconder</button>
  <label>API Key do Gemini:</label>
  <input type="text" id="apikey" placeholder="Cole sua API key aqui..." />
  <a href="https://aistudio.google.com/apikey" target="_blank">➜ Criar sua API Key (abre em nova aba)</a>
  <label>Pergunta:</label>
  <input type="text" id="pergunta" placeholder="Digite sua pergunta..." />
  <label>Imagem (opcional):</label>
  <input type="file" id="imagem" accept="image/*" />
  <img id="imagem-preview"/>
  <button id="btn">Enviar</button>
  <div id="resposta">Esperando pergunta...</div>
</div>
<button id="btn-toggle">↑</button>
`;
  document.body.appendChild(painel);

  // Seletores
  const apikeyInput = document.querySelector("#apikey"),
        perguntaInput = document.querySelector("#pergunta"),
        respostaDiv = document.querySelector("#resposta"),
        botaoEnviar = document.querySelector("#btn"),
        botaoToggle = document.querySelector("#btn-toggle"),
        painelDiv = document.querySelector("#painel-gemini"),
        btnEsconder = document.querySelector("#btn-esconder"),
        imagemInput = document.querySelector("#imagem"),
        imagemPreview = document.querySelector("#imagem-preview"),
        defaultApiKey = "",
        savedKey = localStorage.getItem("gemini_apikey") || defaultApiKey;

  apikeyInput.value = savedKey;

  // Preview da imagem ao selecionar arquivo
  imagemInput.addEventListener("change", function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        imagemPreview.src = e.target.result;
        imagemPreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    } else {
      imagemPreview.style.display = "none";
      imagemPreview.src = "";
    }
  });

  botaoEnviar.onclick = async () => {
    let pergunta = perguntaInput.value.trim(),
        apikey = apikeyInput.value.trim();

    if (!apikey) {
      respostaDiv.textContent = "Por favor, cole sua API Key.";
      return;
    }
    if (!pergunta) {
      respostaDiv.textContent = "Digite uma pergunta primeiro.";
      return;
    }

    respostaDiv.textContent = "Carregando...";
    localStorage.setItem("gemini_apikey", apikey);

    // Prepara partes do conteúdo
    let parts = [{ text: pergunta }];

    // Inclui imagem, se houver
    if (imagemInput.files[0]) {
      const file = imagemInput.files[0];
      const reader = new FileReader();
      reader.onload = async function(e) {
        // Extrai base64 da imagem
        const base64 = e.target.result.split(",")[1];
        parts.push({
          inlineData: {
            mimeType: file.type,
            data: base64
          }
        });

        await sendGemini(parts, apikey);
      };
      reader.readAsDataURL(file);
      return;
    } else {
      await sendGemini(parts, apikey);
    }
  };

  async function sendGemini(parts, apikey) {
    try {
      let o = await fetch(
        https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=AIzaSyA4jEH8Y4Cm7_e0mnu1E4MvrQ1suMfjxok
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }]
          })
        }
      );
      let n = await o.json(),
          i = n.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta.";
      respostaDiv.textContent = i;
    } catch (a) {
      respostaDiv.textContent = "Erro ao buscar resposta.";
      console.error(a);
    }
  }

  btnEsconder.onclick = () => {
    painelDiv.style.display = "none";
    botaoToggle.style.display = "flex";
  };
  botaoToggle.onclick = () => {
    painelDiv.style.display = "block";
    botaoToggle.style.display = "none";
  };
})();
