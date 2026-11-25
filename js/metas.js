/* ==========================================================
   SISTEMA DE METAS
========================================================== */

async function abrirFormularioMeta() {
    const resposta = await abrirModalFormulario({
        titulo: "🎯 Nova meta",
        campos: [
            {
                id: "nome",
                label: "Nome da meta",
                placeholder: "Ex: Reserva de emergência",
                maxLength: LIMITES_TEXTO.meta
            },
            {
                id: "valor",
                label: "Valor que deseja atingir (R$)",
                placeholder: "Ex: 5000,00",
                inputmode: "decimal"
            }
        ],
        textoConfirmar: "Criar meta"
    });

    if (!resposta) return;

    const nome = resposta.nome;
    if (!nome || !nome.trim()) {
        abrirModalAviso("Digite o nome da meta.");
        return;
    }

    const valorTexto = resposta.valor;
    if (!valorTexto) {
        abrirModalAviso("Digite o valor da meta.");
        return;
    }

    const valorMeta = Number(
        valorTexto.replace(/\./g, "").replace(",", ".")
    );

    if (!valorMeta || valorMeta <= 0) {
        abrirModalAviso("Digite um valor de meta válido.");
        return;
    }

    const metas = carregarMetas();

    metas.push({
        id: String(gerarID()),
        nome: nome.trim(),
        valorMeta: valorMeta,
        aportes: []
    });

    salvarMetas(metas);
    renderizarMetas();
}

function renderizarMetas() {
    const lista = document.getElementById("listaMetas");
    if (!lista) return;

    const metas = carregarMetas();
    lista.innerHTML = "";

    if (metas.length === 0) {
        lista.innerHTML = `
          <div class="card">
            <p>Você ainda não possui nenhuma meta.</p>
            <p style="margin-top:8px;color:#777;">
              Crie sua primeira meta acima.
            </p>
          </div>
        `;
        return;
    }

    metas.forEach(meta => {
        const atual = meta.aportes.reduce(
            (total, aporte) => total + Number(aporte.valor),
            0
        );
        const faltante = Math.max(meta.valorMeta - atual, 0);
        const porcentagem = Math.min((atual / meta.valorMeta) * 100, 100);

        const div = document.createElement("div");
        div.className = "cardMeta";
        div.onclick = function() {
            abrirMeta(meta.id);
        };

        div.innerHTML = `
          <div class="nomeMeta">🎯 ${meta.nome}</div>
          <div class="valoresMeta">
            <div class="valorAtualMeta">Atual: R$ ${moeda(atual)}</div>
            <div class="valorObjetivoMeta">Meta: R$ ${moeda(meta.valorMeta)}</div>
            <div class="valorFaltanteMeta">
              ${faltante > 0 ? "Faltam: R$ " + moeda(faltante) : "Meta atingida! 🎉"}
            </div>
          </div>
          <div class="barraMeta">
            <div class="progressoMeta" style="width:${porcentagem}%"></div>
          </div>
          <div class="porcentagemMeta">${porcentagem.toFixed(0)}%</div>
        `;

        lista.appendChild(div);
    });
}

function abrirMeta(id) {
    metaAtualId = id;
    const meta = encontrarMeta(id);
    if (!meta) return;

    document.getElementById("tituloMetaDetalhe").innerText = "🎯 " + meta.nome;
    renderizarDetalheMeta();
    mostrarTela("telaDetalheMeta");
}

function renderizarDetalheMeta() {
    const meta = encontrarMeta(metaAtualId);
    if (!meta) return;

    const atual = meta.aportes.reduce(
        (total, aporte) => total + Number(aporte.valor),
        0
    );
    const faltante = Math.max(meta.valorMeta - atual, 0);
    const porcentagem = Math.min((atual / meta.valorMeta) * 100, 100);

    const resumo = document.getElementById("resumoMetaDetalhe");
    resumo.innerHTML = `
      <div class="valoresMeta">
        <div class="valorAtualMeta">💰 Atual: R$ ${moeda(atual)}</div>
        <div class="valorObjetivoMeta">🎯 Meta: R$ ${moeda(meta.valorMeta)}</div>
        <div class="valorFaltanteMeta">
          ${faltante > 0 ? "📌 Faltam: R$ " + moeda(faltante) : "🎉 Meta atingida!"}
        </div>
        <div class="barraMeta">
          <div class="progressoMeta" style="width:${porcentagem}%"></div>
        </div>
        <div class="porcentagemMeta">${porcentagem.toFixed(0)}% concluído</div>
      </div>
    `;

    renderizarHistoricoMeta();
}

function renderizarHistoricoMeta() {
    const area = document.getElementById("historicoMeta");
    if (!area) return;

    const meta = encontrarMeta(metaAtualId);
    if (!meta) return;

    area.innerHTML = "";

    if (meta.aportes.length === 0) {
        area.innerHTML = "<p>Nenhum valor adicionado ainda.</p>";
        return;
    }

    const aportes = [...meta.aportes].sort(
        (a, b) => new Date(b.data) - new Date(a.data)
    );

    aportes.forEach(aporte => {
        const div = document.createElement("div");
        div.className = "itemHistoricoMeta";

        div.innerHTML = `
          <div>
            <div class="valorHistoricoMeta">+ R$ ${moeda(aporte.valor)}</div>
            <div class="dataHistoricoMeta">${formatarData(aporte.data)}</div>
          </div>
          <button
            class="btnExcluirAporte"
            onclick="event.stopPropagation(); excluirAporte('${aporte.id}')">
            Excluir
          </button>
        `;

        area.appendChild(div);
    });
}

const formAporteMeta = document.getElementById("formAporteMeta");

if (formAporteMeta) {
    formAporteMeta.addEventListener("submit", function(evento) {
        evento.preventDefault();
        if (!metaAtualId) return;

        const campo = document.getElementById("valorAporteMeta");
        const valor = Number(
            campo.value.replace(/\./g, "").replace(",", ".")
        );

        if (!valor || valor <= 0) {
            abrirModalAviso("Digite um valor válido.");
            return;
        }

        const metas = carregarMetas();
        const meta = metas.find(item => String(item.id) === String(metaAtualId));
        if (!meta) return;

        meta.aportes.push({
            id: String(gerarID()),
            valor: valor,
            data: new Date().toISOString()
        });

        salvarMetas(metas);
        campo.value = "";

        renderizarDetalheMeta();
        renderizarMetas();

        const mensagem = document.getElementById("mensagemMeta");
        mensagem.innerText = "Valor adicionado com sucesso!";
        mensagem.style.color = "green";

        setTimeout(() => {
            mensagem.innerText = "";
        }, 3000);
    });
}

async function excluirAporte(id) {
    const confirmar = await abrirModalConfirmacao({
        titulo: "🗑️ Excluir valor",
        texto: "Deseja excluir este valor da meta?",
        textoConfirmar: "Excluir",
        perigo: true
    });

    if (!confirmar) return;

    const metas = carregarMetas();
    const meta = metas.find(item => String(item.id) === String(metaAtualId));
    if (!meta) return;

    meta.aportes = meta.aportes.filter(
        aporte => String(aporte.id) !== String(id)
    );

    salvarMetas(metas);
    renderizarDetalheMeta();
    renderizarMetas();
}

async function excluirMetaAtual() {
    const meta = encontrarMeta(metaAtualId);
    if (!meta) return;

    const confirmar = await abrirModalConfirmacao({
        titulo: "🗑️ Excluir meta",
        texto: `Deseja excluir a meta "${meta.nome}"?\n\nTodos os valores registrados nela também serão excluídos.`,
        textoConfirmar: "Excluir meta",
        perigo: true
    });

    if (!confirmar) return;

    let metas = carregarMetas();
    metas = metas.filter(item => String(item.id) !== String(metaAtualId));

    salvarMetas(metas);
    metaAtualId = null;

    mostrarTela("telaMetas");
    renderizarMetas();
}