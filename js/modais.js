/* ==========================================================
   MODAIS E POP-UPS DO APP
========================================================== */

function mostrarInfoResumo(tipo) {
    const popup = document.getElementById("popupInfoResumo");
    const titulo = document.getElementById("tituloInfoResumo");
    const texto = document.getElementById("textoInfoResumo");

    if (tipo === "categoria") {
        titulo.innerHTML = "🏷️ Gastos por categoria";
        texto.innerHTML =
            "Mostra como os gastos deste mês estão distribuídos entre as categorias.<br><br>" +
            "A porcentagem representa quanto cada categoria corresponde do total de gastos do mês.";
    }

    if (tipo === "pagamento") {
        titulo.innerHTML = "💳 Gastos por forma de pagamento";
        texto.innerHTML =
            "Mostra quanto foi gasto usando cada forma de pagamento neste mês.<br><br>" +
            "A porcentagem representa quanto cada forma de pagamento corresponde do total de gastos.";
    }

    popup.style.display = "flex";
}

function fecharInfoResumo() {
    const popup = document.getElementById("popupInfoResumo");
    popup.style.display = "none";
}

function abrirModalOpcoes({ titulo, texto = "", opcoes = [] }) {
    return new Promise((resolve) => {
        const modal = document.getElementById("modalApp");
        const elTitulo = document.getElementById("modalTitulo");
        const elTexto = document.getElementById("modalTexto");
        const elCorpo = document.getElementById("modalCorpo");
        const elBotoes = document.getElementById("modalBotoes");
        const btnFechar = document.getElementById("modalFechar");

        elTitulo.innerText = titulo;
        elTexto.innerText = texto;
        elCorpo.innerHTML = "";
        elBotoes.innerHTML = "";

        const listaOpcoes = document.createElement("div");
        listaOpcoes.className = "modalListaOpcoes";

        const finalizar = (valor) => {
            modal.style.display = "none";
            modal.onclick = null;
            btnFechar.onclick = null;
            resolve(valor);
        };

        opcoes.forEach((op) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "modalBtnOpcao" + (op.perigo ? " perigo" : "");
            btn.innerText = op.texto;
            btn.onclick = () => finalizar(op.valor);
            listaOpcoes.appendChild(btn);
        });

        elCorpo.appendChild(listaOpcoes);

        const btnCancelar = document.createElement("button");
        btnCancelar.type = "button";
        btnCancelar.className = "modalBtnCancelar";
        btnCancelar.innerText = "Cancelar";
        btnCancelar.onclick = () => finalizar(null);
        elBotoes.appendChild(btnCancelar);

        btnFechar.onclick = () => finalizar(null);
        modal.onclick = (e) => {
            if (e.target === modal) finalizar(null);
        };

        modal.style.display = "flex";
    });
}

function abrirModalFormulario({ titulo, texto = "", campos = [], textoConfirmar = "Salvar" }) {
    return new Promise((resolve) => {
        const modal = document.getElementById("modalApp");
        const elTitulo = document.getElementById("modalTitulo");
        const elTexto = document.getElementById("modalTexto");
        const elCorpo = document.getElementById("modalCorpo");
        const elBotoes = document.getElementById("modalBotoes");
        const btnFechar = document.getElementById("modalFechar");

        elTitulo.innerText = titulo;
        elTexto.innerText = texto;
        elCorpo.innerHTML = "";
        elBotoes.innerHTML = "";

        const inputs = {};

        campos.forEach((campo, indice) => {
            const grupo = document.createElement("div");
            grupo.className = "modalCampo";

            const label = document.createElement("label");
            label.innerText = campo.maxLength
                ? `${campo.label} (máx. ${campo.maxLength})`
                : campo.label;

            const input = document.createElement("input");
            input.type = campo.type || "text";
            input.value = campo.valorInicial || "";
            input.placeholder = campo.placeholder || "";
            if (campo.maxLength) {
                input.maxLength = campo.maxLength;
            }
            if (campo.inputmode) {
                input.setAttribute("inputmode", campo.inputmode);
            }

            grupo.appendChild(label);
            grupo.appendChild(input);
            elCorpo.appendChild(grupo);

            inputs[campo.id] = input;

            if (indice === 0) {
                setTimeout(() => input.focus(), 50);
            }
        });

        const finalizar = (resultado) => {
            modal.style.display = "none";
            modal.onclick = null;
            btnFechar.onclick = null;
            resolve(resultado);
        };

        const confirmar = () => {
            const valores = {};
            for (const campo of campos) {
                valores[campo.id] = inputs[campo.id].value;
            }
            finalizar(valores);
        };

        Object.values(inputs).forEach((input) => {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    confirmar();
                }
            });
        });

        const btnCancelar = document.createElement("button");
        btnCancelar.type = "button";
        btnCancelar.className = "modalBtnCancelar";
        btnCancelar.innerText = "Cancelar";
        btnCancelar.onclick = () => finalizar(null);

        const btnSalvar = document.createElement("button");
        btnSalvar.type = "button";
        btnSalvar.className = "modalBtnConfirmar";
        btnSalvar.innerText = textoConfirmar;
        btnSalvar.onclick = confirmar;

        elBotoes.appendChild(btnCancelar);
        elBotoes.appendChild(btnSalvar);

        btnFechar.onclick = () => finalizar(null);
        modal.onclick = (e) => {
            if (e.target === modal) finalizar(null);
        };

        modal.style.display = "flex";
    });
}

function abrirModalConfirmacao({
    titulo = "Confirmação",
    texto = "",
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    perigo = false
}) {
    return new Promise((resolve) => {
        const modal = document.getElementById("modalApp");
        const elTitulo = document.getElementById("modalTitulo");
        const elTexto = document.getElementById("modalTexto");
        const elCorpo = document.getElementById("modalCorpo");
        const elBotoes = document.getElementById("modalBotoes");
        const btnFechar = document.getElementById("modalFechar");

        elTitulo.innerText = titulo;
        elTexto.innerText = texto;
        elCorpo.innerHTML = "";
        elBotoes.innerHTML = "";

        const finalizar = (resultado) => {
            modal.style.display = "none";
            modal.onclick = null;
            btnFechar.onclick = null;
            resolve(resultado);
        };

        const btnCancelar = document.createElement("button");
        btnCancelar.type = "button";
        btnCancelar.className = "modalBtnCancelar";
        btnCancelar.innerText = textoCancelar;
        btnCancelar.onclick = () => finalizar(false);

        const btnConfirmar = document.createElement("button");
        btnConfirmar.type = "button";
        btnConfirmar.className = perigo ? "modalBtnPerigo" : "modalBtnConfirmar";
        btnConfirmar.innerText = textoConfirmar;
        btnConfirmar.onclick = () => finalizar(true);

        elBotoes.appendChild(btnCancelar);
        elBotoes.appendChild(btnConfirmar);

        btnFechar.onclick = () => finalizar(false);
        modal.onclick = (e) => {
            if (e.target === modal) finalizar(false);
        };

        modal.style.display = "flex";
    });
}

function abrirModalAviso(texto, titulo = "⚠️ Atenção") {
    return new Promise((resolve) => {
        const modal = document.getElementById("modalApp");
        const elTitulo = document.getElementById("modalTitulo");
        const elTexto = document.getElementById("modalTexto");
        const elCorpo = document.getElementById("modalCorpo");
        const elBotoes = document.getElementById("modalBotoes");
        const btnFechar = document.getElementById("modalFechar");

        elTitulo.innerText = titulo;
        elTexto.innerText = texto;
        elCorpo.innerHTML = "";
        elBotoes.innerHTML = "";

        const finalizar = () => {
            modal.style.display = "none";
            modal.onclick = null;
            btnFechar.onclick = null;
            resolve();
        };

        const btnOk = document.createElement("button");
        btnOk.type = "button";
        btnOk.className = "modalBtnConfirmar";
        btnOk.innerText = "OK";
        btnOk.onclick = finalizar;

        elBotoes.appendChild(btnOk);

        btnFechar.onclick = finalizar;
        modal.onclick = (e) => {
            if (e.target === modal) finalizar();
        };

        modal.style.display = "flex";
    });
}