const CLIENT_ID = "394307226444-3mk9qbq4acosid7v1lbe81emb1u70sli.apps.googleusercontent.com";

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const mensagem = document.getElementById("mensagem");
const figura = document.getElementById("desenho");
const botaoBaixar = document.getElementById("baixar");

let idToken = null;
let svgAtual = null;

function aoLogar(resposta) {
  idToken = resposta.credential;
  mensagem.textContent = "Login feito. Escolha um número e clique em Desenhar.";
}

function iniciarGoogle() {
  google.accounts.id.initialize({ client_id: CLIENT_ID, callback: aoLogar });
  google.accounts.id.renderButton(document.getElementById("botao-google"), {
    theme: "outline",
    size: "large",
  });
}

if (window.google?.accounts?.id) {
  iniciarGoogle();
} else {
  window.onGoogleLibraryLoad = iniciarGoogle;
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";
  figura.innerHTML = "";
  botaoBaixar.hidden = true;
  svgAtual = null;

  const numero = Number(campoNumero.value);
  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    mensagem.textContent = "Digite um número inteiro entre 1 e 100.";
    return;
  }
  if (!idToken) {
    mensagem.textContent = "Entre com a sua conta Google antes de desenhar.";
    return;
  }

  let resposta;
  try {
    resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + idToken,
      },
      body: JSON.stringify({ numero }),
    });
  } catch {
    mensagem.textContent = "Não foi possível falar com o servidor.";
    return;
  }

  if (resposta.status === 400) {
    mensagem.textContent = "Erro 400: pedido inválido. Use um número inteiro entre 1 e 100.";
    return;
  }
  if (resposta.status === 401) {
    idToken = null;
    mensagem.textContent = "Erro 401: login inválido ou expirado. Entre com o Google novamente.";
    return;
  }
  if (!resposta.ok) {
    mensagem.textContent = "Erro " + resposta.status + " ao gerar o desenho.";
    return;
  }

  svgAtual = await resposta.text();
  figura.innerHTML = svgAtual;
  botaoBaixar.hidden = false;
});

botaoBaixar.addEventListener("click", () => {
  if (!svgAtual) return;
  const blob = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "desenho.svg";
  link.click();
  URL.revokeObjectURL(url);
});
