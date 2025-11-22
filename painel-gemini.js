(function(){
  if (document.getElementById("painel-gemini")) return;

  const painel = document.createElement("div");
  painel.innerHTML = `
<style>
#painel-gemini{position:fixed;bottom:20px;right:20px;width:340px;max-width:99vw;max-height:540px;padding:16px 13px 24px 13px;background:#191c1d;color:#eee;font-family:sans-serif;border-radius:12px;box-shadow:0 0 18px #000;z-index:2147483647;overflow-y:auto}
#painel-gemini input[type="text"],#painel-gemini input[type="file"],#painel-gemini button{width:100%;box-sizing:border-box;margin-bottom:10px;padding:8px 6px;border-radius:5px;border:none}
#painel-gemini input[type="text"]{background:#2c2f30;color:#fafafa;font-size:1rem;outline:none}
#painel-gemini input[type="text"]:focus{background:#232628}
#painel-gemini input[type="file"]{background:transparent;color:#fff;font-size:13px;}
#painel-gemini button{background:#4caf50;color:#fff;font-weight:700;font-size:1.01rem;margin-bottom:7px;margin-top:4px;cursor:pointer;transition:.2s}
#painel-gemini button:hover{filter:brightness(0.88);}
#painel-gemini #btn-esconder{position:absolute!important;top:8px!important;right:10px!important;width:auto!important;background:none!important;border:none!important;color:#fff!important;font-size:12px!important;cursor:pointer!important;box-shadow:none!important;padding:2px 4px!important;}
#painel-gemini #resposta{margin-top:6px;white-space:pre-wrap;word-break:break-word;padding:10px 3px 5px 0;color:#bbf;background:#212327;font-size:1rem;}
#painel-gemini a{color:#4fc3f7;text-decoration:none;font-size:12px}
#painel-gemini label{font-size:14px;margin-bottom:5px;display:block;color:#fff}
#apikey{color:#4caf50!important;}
#imagem-preview {max-width:100%;display:none;margin-bottom:10px;border-radius:5px;}
#btn-toggle{position:fixed;bottom:20px;right:20px;background:#000;color:#fff;border:none;border-radius:50%;width:36px;height:36px;font-size:16px;cursor:pointer;display:none;justify-content:center;align-items:center;z-index:2147483647;}
</style>
<div id="painel-gemini">
  <button id="btn-esconder">esconder</button>
  <label>API Key do Gemini:
    <input type="text" id="apikey" placeholder="Cole sua API key aqui..."/>
  </label>
  <a href="https://aistudio.google.com/apikey" target="_blank">➜ Criar sua API Key (abre em nova aba)</a>
  <label>Pergunta:
    <input type="text" id="pergunta" placeholder="Digite sua pergunta..."/>
  </label>
  <label>Imagem (opcional):
    <input type="file" id="imagem" accept="image/*"/>
  </label>
  <img id="imagem-preview"/>
  <button id="btn" title="Enviar pergunta para o Gemini">Enviar</button>
  <div id="resposta">Esperando pergunta...</div>
</div>
<button id="btn-toggle">↑</button>
`;
  document.body.appendChild(painel);

  const apikeyInput   = document.getElementById("apikey"),
        perguntaInput = document.getElementById("pergunta"),
        respostaDiv   = document.getElementById("resposta"),
        botaoEnviar   = document.getElementById("btn"),
        botaoToggle   = document.getElementById("btn-toggle"),
        painelDiv     = document.getElementById("painel-gemini"),
        btnEsconder   = document.getElementById("btn-esconder"),
        imagemInput   = document.getElementById("imagem"),
        imagemPreview = document.getElementById("imagem-preview"),
        savedKey      = localStorage.getItem("gemini_apikey") || "";

  apikeyInput.value = savedKey;

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
    let pergunta = perguntaInput.value.trim();
    let apikey   = apikeyInput.value.trim();

    if (!apikey)   { respostaDiv.textContent = "Por favor, cole sua API Key."; return; }
    if (!pergunta) { respostaDiv.textContent = "Digite uma pergunta primeiro."; return; }

    respostaDiv.textContent = "Carregando...";
    localStorage.setItem("gemini_apikey", apikey);

    const MODELS = [
      "gemini-1.5-flash-latest",
      "gemini-1.5-pro-latest",
      "gemini-pro"
    ];

    let parts = [{ text: pergunta }];

    if (imagemInput.files[0]) {
      const file = imagemInput.files[0];
      const reader = new FileReader();
      reader.onload = async function(e) {
        const base64 = e.target.result.split(",")[1];
        parts.push({ inlineData: { mimeType: file.type, data: base64 } });
        await tryGemini(parts, apikey, respostaDiv, MODELS);
      };
      reader.readAsDataURL(file);
      return;
    } else {
      await tryGemini(parts, apikey, respostaDiv, MODELS);
    }
  };

  async function tryGemini(parts, apikey, respostaDiv, models) {
    for (let m of models) {
      try {
        const url = "https://generativelanguage.googleapis.com/v1/models/" + encodeURIComponent(m) + ":generateContent?key=" + encodeURIComponent(apikey);
        let resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({contents: [{parts}]})
        });
        let n = await resp.json();
        if (n.candidates && n.candidates[0] && n.candidates[0].content && n.candidates[0].content.parts && n.candidates[0].content.parts[0] && n.candidates[0].content.parts[0].text) {
          respostaDiv.textContent = n.candidates[0].content.parts[0].text;
          return;
        } else if (n.error && n.error.message) {
          if (
            /invalid.*field|model does not support|image|not enabled|unsupported/i.test(n.error.message)
          ) {
            continue;
          }
          respostaDiv.textContent = "Erro: " + n.error.message;
          return;
        }
      } catch (e) {
        respostaDiv.textContent = "Erro na requisição: " + e.message;
        return;
      }
    }
    respostaDiv.textContent = "Nenhum modelo Gemini disponível para esta pergunta com sua chave.";
  }

  btnEsconder.onclick = function() { painelDiv.style.display = "none"; botaoToggle.style.display = "flex"; };
  botaoToggle.onclick = function() { painelDiv.style.display = "block"; botaoToggle.style.display = "none"; };
})();
