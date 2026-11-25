/* ==========================================================
   NAVEGAÇÃO E INICIALIZAÇÃO DO APP
========================================================== */

function mostrarTela(id, botao = null) {
    if (id === "telaInicio") {
        if (telaExtraNoHistorico) {
            history.back();
        }
    } else if (!telaExtraNoHistorico) {
        history.pushState({ tela: id }, "");
        telaExtraNoHistorico = true;
    } else {
        history.replaceState({ tela: id }, "");
    }

    exibirTela(id, botao);
}

window.addEventListener("popstate", () => {
    telaExtraNoHistorico = false;
    exibirTela("telaInicio");
});

function exibirTela(id, botao = null) {
    document.querySelectorAll(".tela").forEach(tela => {
        tela.classList.remove("ativa");
    });

    if (id === "telaInicio") atualizarInicio();
    if (id === "telaResumo") renderizar();
    if (id === "telaMetas") renderizarMetas();
    if (id === "telaDetalheMeta") renderizarDetalheMeta();
    if (id === "telaCategorias") renderizarCategorias();
    if (id === "telaFormasPagamento") renderizarFormasPagamento();

    const tela = document.getElementById(id);
    if (tela) {
        tela.classList.add("ativa");
    }

    document.querySelectorAll(".itemMenu").forEach(item => {
        item.classList.remove("ativo");
    });

    if (botao) {
        botao.classList.add("ativo");
    } else {
        const mapa = {
            telaInicio: 0,
            telaResumo: 1,
            telaLancamentos: 2,
            telaMetas: 3,
            telaDetalheMeta: 3,
            telaConfiguracoes: 4,
            telaCategorias: 4,
            telaFormasPagamento: 4
        };

        const indice = mapa[id];
        if (indice !== undefined) {
            document.querySelectorAll(".itemMenu")[indice].classList.add("ativo");
        }
    }
}

function iniciarApp() {
    if (inputDescricao) inputDescricao.maxLength = LIMITES_TEXTO.descricao;
    if (inputObservacao) inputObservacao.maxLength = LIMITES_TEXTO.observacao;

    inputDataLancamento.value = dataHojeLocal();

    const hoje = new Date();
    filtroMes.value =
        hoje.getFullYear() +
        "-" +
        String(hoje.getMonth() + 1).padStart(2, "0");

    mesInicioAtual = filtroMes.value;

    atualizarCategoriasLancamento();
    atualizarFormasPagamentoLancamento();
    atualizarMesExibido();
    gerarRecorrenciasDoMes();
    atualizarInicio();
    atualizarResumoInteligente();
    renderizar();
}

iniciarApp();