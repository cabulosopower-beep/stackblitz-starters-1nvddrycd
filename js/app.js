/* ==========================================================
   CONTROLE FINANCEIRO
   APP PRINCIPAL
========================================================== */

/* ==========================================================
   CONFIGURAÇÕES
========================================================== */

const STORAGE = "controle_financeiro";
let idEdicao = null;

const STORAGE_RECORRENTES = "controle_recorrencias";

const MSG_EXCLUIR_REGISTRO =
    "Deseja excluir este registro?";

const MSG_EXCLUIR_GRUPO =
    "Deseja excluir todas as parcelas deste lançamento?";

/* ==========================================================
   ELEMENTOS DA INTERFACE
========================================================== */

const form = document.getElementById("form");
const lista = document.getElementById("lista");
const parcelado = document.getElementById("parcelado");
const areaParcelas = document.getElementById("areaParcelas");
const filtroMes = document.getElementById("filtroMes");
const buscar = document.getElementById("buscar");
const ordenacao = document.getElementById("ordenacao");

const inputDescricao = document.getElementById("descricao");
const inputValor = document.getElementById("valor");
const inputDataLancamento = document.getElementById("dataLancamento");
const selectTipo = document.getElementById("tipo");
const selectCategoria = document.getElementById("categoria");
const inputObservacao = document.getElementById("observacao");
const inputParcelas = document.getElementById("parcelas");
const selectFormaPagamento = document.getElementById("formaPagamento");

const totalDespesasMes = document.getElementById("totalDespesasMes");
const totalPendenteMes = document.getElementById("totalPendenteMes");
const totalReceitasMes = document.getElementById("totalReceitasMes");
const saldoMes = document.getElementById("saldoMes");

const saldoInicio = document.getElementById("saldoInicio");
const receitasInicio = document.getElementById("receitasInicio");
const despesasInicio = document.getElementById("despesasInicio");
const pendenciasInicio = document.getElementById("pendenciasInicio");
const mesAtualInicio = document.getElementById("mesAtualInicio");
const quantidadeInicio = document.getElementById("quantidadeInicio");

const gastosMes = document.getElementById("gastosMes");
const receitasMes = document.getElementById("receitasMes");
const resultadoMes = document.getElementById("resultadoMes");
const maiorGasto = document.getElementById("maiorGasto");
const campoValor = document.getElementById("valor");

function calcularExpressao(valor) {
    let expressao = String(valor)
        .replace(/(\d)\.(?=\d{3}(?:[.,]|$))/g, "$1")
        .replace(/,/g, ".")
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/\s/g, "");

    if (!/^[0-9.+\-*/()]+$/.test(expressao)) {
        return null;
    }

    try {
        const resultado = Function(
            '"use strict"; return (' + expressao + ')'
        )();

        if (!Number.isFinite(resultado)) {
            return null;
        }

        return Number(resultado.toFixed(2));
    } catch (erro) {
        return null;
    }
}

/* ==========================================================
   EVENTOS
========================================================== */

filtroMes.addEventListener("change", () => {
    atualizarMesExibido();
    gerarRecorrenciasDoMes();
    renderizar();
});

function atualizarMesExibido() {
    if (!filtroMes.value) return;

    const [ano, mes] = filtroMes.value.split("-");
    const data = new Date(Number(ano), Number(mes) - 1, 1);

    const nomeMes = data.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
    });

    const mesExibido = document.getElementById("mesExibido");

    if (mesExibido) {
        mesExibido.innerText =
            nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
    }
}

function mudarMes(direcao) {
    if (!filtroMes.value) return;

    const [ano, mes] = filtroMes.value.split("-").map(Number);
    const data = new Date(ano, mes - 1, 1);

    data.setMonth(data.getMonth() + direcao);

    const novoAno = data.getFullYear();
    const novoMes = String(data.getMonth() + 1).padStart(2, "0");

    filtroMes.value = `${novoAno}-${novoMes}`;

    atualizarMesExibido();
    gerarRecorrenciasDoMes();
    renderizar();
}

buscar.addEventListener("input", renderizar);
ordenacao.addEventListener("change", renderizar);

parcelado.addEventListener("change", () => {
    if (parcelado.value === "sim") {
        areaParcelas.style.display = "block";
    } else {
        areaParcelas.style.display = "none";
    }
});

/* ==========================================================
   BANCO DE DADOS LOCAL
========================================================== */

function carregarDados() {
    return JSON.parse(localStorage.getItem(STORAGE) || "[]");
}

function salvarDados(dados) {
    localStorage.setItem(STORAGE, JSON.stringify(dados));
}

function carregarRecorrencias() {
    return JSON.parse(localStorage.getItem(STORAGE_RECORRENTES) || "[]");
}

function salvarRecorrencias(recorrencias) {
    localStorage.setItem(
        STORAGE_RECORRENTES,
        JSON.stringify(recorrencias)
    );
}

function gerarRecorrenciasDoMes() {
    const recorrencias = carregarRecorrencias();
    const dados = carregarDados();

    if (!recorrencias.length) return;
    if (!filtroMes || !filtroMes.value) return;

    const [ano, mesNumero] = filtroMes.value.split("-").map(Number);
    const mes = mesNumero - 1;

    let alterou = false;

    recorrencias.forEach(recorrencia => {
        const inicio = new Date(recorrencia.inicio);
        const inicioAno = inicio.getFullYear();
        const inicioMes = inicio.getMonth();

        if (ano < inicioAno || (ano === inicioAno && mes < inicioMes)) {
            return;
        }

        const chaveMes = `${ano}-${String(mes + 1).padStart(2, "0")}`;

        if (recorrencia.excluidos && recorrencia.excluidos.includes(chaveMes)) {
            return;
        }

        if (recorrencia.fim && chaveMes > recorrencia.fim) {
            return;
        }

        const jaExiste = dados.some(item => {
            if (item.recorrenciaId !== recorrencia.id) {
                return false;
            }
            const dataItem = new Date(item.data);
            return (
                dataItem.getFullYear() === ano &&
                dataItem.getMonth() === mes
            );
        });

        if (jaExiste) return;

        const ultimoDia = new Date(ano, mes + 1, 0).getDate();
        const dia = Math.min(recorrencia.dia, ultimoDia);
        const dataRecorrencia = new Date(ano, mes, dia, 12, 0, 0);

        dados.push({
            id: String(gerarID()),
            grupo: recorrencia.id,
            recorrenciaId: recorrencia.id,
            recorrente: true,
            descricao: recorrencia.descricao,
            valor: recorrencia.valor,
            tipo: recorrencia.tipo,
            categoria: recorrencia.categoria,
            formaPagamento: recorrencia.formaPagamento,
            observacao: recorrencia.observacao,
            parcela: "",
            status: "pendente",
            data: dataRecorrencia.toISOString()
        });

        alterou = true;
    });

    if (alterou) {
        salvarDados(dados);
    }
}

function gerarID() {
    return Date.now() + Math.random();
}

/* ==========================================================
   FUNÇÕES AUXILIARES
========================================================== */

function formatarData(data) {
    const dataObj = new Date(data);
    return (
        dataObj.toLocaleDateString("pt-BR") +
        " " +
        dataObj.toLocaleTimeString("pt-BR")
    );
}

function encontrarRegistro(dados, id) {
    return dados.find(item => String(item.id) === String(id));
}

function editarRegistro(id) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);

    if (!registro) {
        return;
    }

    inputDescricao.value = registro.descricao;
    expressaoCalc = String(registro.valor).replace(".", ",");
    inputValor.value = expressaoCalc;
    atualizarTeclado();

    inputDataLancamento.value = registro.data.split("T")[0];
    selectTipo.value = registro.tipo;
    selectCategoria.value = registro.categoria;
    inputObservacao.value = registro.observacao || "";
    selectFormaPagamento.value = registro.formaPagamento || "";

    parcelado.disabled = true;

    if (registro.recorrente) {
        parcelado.value = "recorrente";
        areaParcelas.style.display = "none";
        inputParcelas.disabled = true;
    } else if (registro.parcela) {
        const partesParcela = registro.parcela.split("/");
        const quantidadeParcelas = Number(partesParcela[1]);

        parcelado.value = "sim";
        areaParcelas.style.display = "block";
        inputParcelas.value = quantidadeParcelas;
        inputParcelas.disabled = true;
    } else {
        parcelado.value = "nao";
        areaParcelas.style.display = "none";
        inputParcelas.disabled = true;
    }

    idEdicao = id;
    document.querySelector(".btnSalvar").innerText = "Atualizar Registro";

    const botaoCancelar = document.getElementById("btnCancelarEdicao");
    if (botaoCancelar) {
        botaoCancelar.style.display = "inline-block";
    }

    const avisoEdicao = document.getElementById("avisoEdicao");
    if (avisoEdicao) {
        avisoEdicao.innerText = registro.parcela
            ? `✏️ Editando: ${registro.descricao} — Parcela ${registro.parcela}`
            : `✏️ Editando: ${registro.descricao}`;
        avisoEdicao.style.display = "block";
    }

    mostrarTela("telaLancamentos");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function moeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function toggleMenu(id) {
    document.querySelectorAll(".menuAcoes").forEach(menu => {
        if (menu.id !== "menu-" + id) {
            menu.classList.remove("aberto");
        }
    });

    document.getElementById("menu-" + id).classList.toggle("aberto");
}

document.addEventListener("click", function(e) {
    if (!e.target.closest(".acoesTransacao")) {
        document.querySelectorAll(".menuAcoes").forEach(menu => {
            menu.classList.remove("aberto");
        });
    }
});

/* ==========================================================
   CADASTRO DE MOVIMENTAÇÃO
========================================================== */

form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const descricao = inputDescricao.value.trim();
    const valor = calcularExpressao(inputValor.value);

    if (valor === null || valor <= 0) {
        alert("Digite um valor ou uma conta válida.");
        return;
    }

    const tipo = selectTipo.value;
    const categoria = selectCategoria.value;
    const observacao = inputObservacao.value.trim();
    const formaPagamento = selectFormaPagamento.value;

    if (!tipo) {
        alert("Selecione o tipo (Despesa ou Receita).");
        return;
    }

    if (!categoria) {
        alert("Selecione uma categoria.");
        return;
    }

    if (!parcelado.value) {
        alert("Selecione a opção de repetição.");
        return;
    }

    if (!idEdicao && parcelado.value === "sim" && (!inputParcelas.value || Number(inputParcelas.value) < 2)) {
        alert("Digite uma quantidade de parcelas válida (mínimo 2).");
        return;
    }

    const dataEscolhida = inputDataLancamento.value;
    const agora = dataEscolhida
        ? new Date(dataEscolhida + "T12:00:00")
        : new Date();

    const dados = carregarDados();

    /* =====================================================
       EDIÇÃO DE LANÇAMENTO
    ===================================================== */

    if (idEdicao) {
        const registro = encontrarRegistro(dados, idEdicao);
        if (!registro) return;

        const grupoOriginal = registro.grupo;
        const dataOriginal = new Date(registro.data);
        const dataOriginalInput = registro.data.split("T")[0];
        const dataFoiAlterada = dataEscolhida !== dataOriginalInput;

        const parcelasGrupo = dados
            .filter(item => item.grupo === grupoOriginal)
            .sort((a, b) => new Date(a.data) - new Date(b.data));

        let opcao;

        if (registro.recorrente) {
            opcao = await abrirModalOpcoes({
                titulo: "✏️ Editar recorrência",
                texto: "Este lançamento faz parte de uma recorrência. Como deseja aplicar a alteração?",
                opcoes: [
                    { valor: "1", texto: "1 - Editar somente este mês" },
                    { valor: "2", texto: "2 - Editar este mês e os próximos" },
                    { valor: "3", texto: "3 - Editar toda a recorrência" }
                ]
            });

            if (!opcao) return;
        } else if (registro.parcela) {
            opcao = await abrirModalOpcoes({
                titulo: "✏️ Editar parcelamento",
                texto: "Como deseja aplicar a alteração?",
                opcoes: [
                    { valor: "1", texto: "1 - Editar somente esta parcela" },
                    { valor: "2", texto: "2 - Editar esta e as futuras" },
                    { valor: "3", texto: "3 - Editar todas as parcelas" }
                ]
            });

            if (!opcao) return;
        } else {
            opcao = "esta";
        }

        function aplicarAlteracoes(item, novaData, manterDataOriginal = false) {
            item.descricao = descricao;
            item.valor = valor;
            item.tipo = tipo;
            item.categoria = categoria;
            item.formaPagamento = formaPagamento;
            item.observacao = observacao;

            if (!manterDataOriginal) {
                item.data = novaData.toISOString();
            }
        }

        if (registro.recorrente && opcao === "1") {
            aplicarAlteracoes(registro, agora, !dataFoiAlterada);
        } else if (registro.recorrente && opcao === "2") {
            aplicarAlteracoes(registro, agora, !dataFoiAlterada);

            const recorrencias = carregarRecorrencias();
            const recorrencia = recorrencias.find(
                item => String(item.id) === String(registro.recorrenciaId)
            );

            if (recorrencia) {
                recorrencia.descricao = descricao;
                recorrencia.valor = valor;
                recorrencia.tipo = tipo;
                recorrencia.categoria = categoria;
                recorrencia.formaPagamento = formaPagamento;
                recorrencia.observacao = observacao;

                if (dataFoiAlterada) {
                    recorrencia.dia = agora.getDate();
                }

                salvarRecorrencias(recorrencias);

                parcelasGrupo
                    .filter(item => new Date(item.data) >= dataOriginal)
                    .forEach(item => {
                        aplicarAlteracoes(item, new Date(item.data), true);
                    });
            }
        } else if (registro.recorrente && opcao === "3") {
            const recorrencias = carregarRecorrencias();
            const recorrencia = recorrencias.find(
                item => String(item.id) === String(registro.recorrenciaId)
            );

            if (recorrencia) {
                recorrencia.descricao = descricao;
                recorrencia.valor = valor;
                recorrencia.tipo = tipo;
                recorrencia.categoria = categoria;
                recorrencia.formaPagamento = formaPagamento;
                recorrencia.observacao = observacao;

                if (dataFoiAlterada) {
                    recorrencia.dia = agora.getDate();
                }

                salvarRecorrencias(recorrencias);
            }

            parcelasGrupo.forEach(item => {
                aplicarAlteracoes(item, new Date(item.data), true);
            });

            aplicarAlteracoes(registro, agora, !dataFoiAlterada);
        } else if (opcao === "esta") {
            aplicarAlteracoes(registro, agora, !dataFoiAlterada);
        } else if (opcao === "2") {
            const indiceAtual = parcelasGrupo.findIndex(
                item => String(item.id) === String(registro.id)
            );

            parcelasGrupo.slice(indiceAtual).forEach((item, indice) => {
                if (!dataFoiAlterada) {
                    aplicarAlteracoes(item, new Date(item.data), true);
                    return;
                }

                const novaData = new Date(agora);
                novaData.setMonth(novaData.getMonth() + indice);
                aplicarAlteracoes(item, novaData);
            });
        } else if (opcao === "3") {
            parcelasGrupo.forEach((item, indice) => {
                if (!dataFoiAlterada) {
                    aplicarAlteracoes(item, new Date(item.data), true);
                    return;
                }

                const novaData = new Date(agora);
                novaData.setMonth(novaData.getMonth() + indice);
                aplicarAlteracoes(item, novaData);
            });
        }

        idEdicao = null;
        document.querySelector(".btnSalvar").innerText = "Salvar Registro";

        salvarDados(dados);
        limparFormulario();
        atualizarInicio();
        renderizar();

        const msg = document.getElementById("mensagem");
        msg.innerText = "Registro atualizado com sucesso!";
        msg.style.color = "green";

        setTimeout(() => {
            msg.innerText = "";
        }, 3000);

        return;
    }

    /* =====================================================
       NOVO LANÇAMENTO
    ===================================================== */

    const confirmar = confirm(
        `Deseja salvar este lançamento?\n\n` +
        `Descrição: ${descricao}\n` +
        `Valor: R$ ${moeda(valor)}\n` +
        `Categoria: ${categoria}\n` +
        `Parcelado: ${
            parcelado.value === "sim"
                ? inputParcelas.value + "x"
                : "Não"
        }`
    );

    if (!confirmar) {
        return;
    }

    const grupoID = String(Date.now() + Math.random());

    if (parcelado.value === "sim") {
        criarParcelas({
            dados,
            grupoID,
            descricao,
            valor,
            tipo,
            categoria,
            formaPagamento,
            observacao,
            agora
        });
    } else if (parcelado.value === "recorrente") {
        const recorrencias = carregarRecorrencias();

        recorrencias.push({
            id: grupoID,
            descricao,
            valor,
            tipo,
            categoria,
            formaPagamento,
            observacao,
            dia: agora.getDate(),
            inicio: agora.toISOString(),
            excluidos: []
        });

        salvarRecorrencias(recorrencias);

        dados.push({
            id: String(gerarID()),
            grupo: grupoID,
            recorrenciaId: grupoID,
            recorrente: true,
            descricao,
            valor,
            tipo,
            categoria,
            formaPagamento,
            observacao,
            parcela: "",
            status: "pendente",
            data: agora.toISOString()
        });
    } else {
        dados.push({
            id: String(gerarID()),
            grupo: grupoID,
            descricao,
            valor,
            tipo,
            categoria,
            formaPagamento,
            observacao,
            parcela: "",
            status: "pendente",
            data: agora.toISOString()
        });
    }

    salvarDados(dados);
    limparFormulario();
    atualizarInicio();
    renderizar();

    const msg = document.getElementById("mensagem");
    msg.innerText = "Registro salvo com sucesso!";
    msg.style.color = "green";

    setTimeout(() => {
        msg.innerText = "";
    }, 3000);
});

/* ==========================================================
   CRIAÇÃO DE PARCELAS
========================================================== */

function criarParcelas({
    dados,
    grupoID,
    descricao,
    valor,
    tipo,
    categoria,
    formaPagamento,
    observacao,
    agora
}) {
    const quantidade = Number(inputParcelas.value);
    const valorParcela = Number(valor);
    const diaOriginal = agora.getDate();

    for (let i = 0; i < quantidade; i++) {
        const ano = agora.getFullYear();
        const mes = agora.getMonth() + i;

        const ultimoDiaDoMes = new Date(ano, mes + 1, 0).getDate();
        const dia = Math.min(diaOriginal, ultimoDiaDoMes);
        const dataParcela = new Date(ano, mes, dia, 12, 0, 0);

        dados.push({
            id: String(gerarID()),
            grupo: grupoID,
            descricao,
            valor: valorParcela,
            tipo,
            categoria,
            formaPagamento,
            observacao,
            parcela: `${i + 1}/${quantidade}`,
            status: "pendente",
            data: dataParcela.toISOString()
        });
    }
}

/* ==========================================================
   LIMPAR FORMULÁRIO
========================================================== */

function limparFormulario() {
    form.reset();

    inputValor.value = "";
    expressaoCalc = "";

    const resultadoTeclado = document.getElementById("resultadoTeclado");
    if (resultadoTeclado) {
        resultadoTeclado.innerText = "R$ 0,00";
    }

    areaParcelas.style.display = "none";
    inputParcelas.disabled = false;
    parcelado.disabled = false;
    inputParcelas.value = "";

    inputDataLancamento.value = new Date().toISOString().split("T")[0];
    idEdicao = null;

    document.querySelector(".btnSalvar").innerText = "Salvar Registro";

    const botaoCancelar = document.getElementById("btnCancelarEdicao");
    if (botaoCancelar) {
        botaoCancelar.style.display = "none";
    }

    const aviso = document.getElementById("avisoEdicao");
    if (aviso) {
        aviso.innerText = "";
        aviso.style.display = "none";
    }
}

function cancelarEdicao() {
    idEdicao = null;
    limparFormulario();
    mostrarTela("telaResumo");
}

/* ==========================================================
   CRIAÇÃO VISUAL DAS TRANSAÇÕES
========================================================== */

function criarTransacao(item) {
    const div = document.createElement("div");
    div.className = "transacao";

    div.innerHTML = `
        <div class="linha linhaPrincipal">
            <div class="titulo tituloTransacao">
                <span class="descricaoTransacao">
                    ${item.descricao}
                </span>
                ${
                    item.parcela
                        ? `<span class="parcelaTitulo">${item.parcela}</span>`
                        : ""
                }
            </div>
            <div class="${
                item.tipo === "receita" ? "valorReceita" : "valorDespesa"
            } valorTransacao">
                R$ ${moeda(item.valor)}
            </div>
        </div>

        <div class="info">
            ${item.categoria ? item.categoria : ""}
            ${item.formaPagamento ? (item.categoria ? " | " : "") + item.formaPagamento : ""}
            ${item.categoria || item.formaPagamento ? " | " : ""}
            ${new Date(item.data).toLocaleDateString("pt-BR")}
        </div>

        ${
            item.observacao && item.observacao.trim() !== ""
                ? `<div class="info observacaoCompacta">📝 ${item.observacao}</div>`
                : ""
        }

        <div class="acoesTransacao">
            <button
                onclick="alterarStatus('${item.id}')"
                class="${item.status === "pago" ? "btnPago" : "btnPagar"}"
            >
                ${item.status === "pago" ? "Pago" : "Pagar"}
            </button>

            <button
                class="btnMenu"
                onclick="toggleMenu('${item.id}')"
            >
                ⋮
            </button>

            <div class="menuAcoes" id="menu-${item.id}">
                <button onclick="editarRegistro('${item.id}')">
                    ✏️ Editar
                </button>
                <button onclick="excluirRegistro('${item.id}')">
                    🗑️ Excluir
                </button>
                <button onclick="excluirGrupo('${item.id}')">
                    🗑️ Excluir tudo
                </button>
            </div>
        </div>
    `;

    return div;
}

/* ==========================================================
   ATUALIZAR TELA INICIAL
========================================================== */

function atualizarInicio() {
    const dados = carregarDados();

    let receitas = 0;
    let despesas = 0;
    let pendentes = 0;
    let receitasAnterior = 0;
    let despesasAnterior = 0;

    const hoje = new Date();
    const numeroMes = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const dataMesAnterior = new Date(anoAtual, numeroMes - 1, 1);
    const numeroMesAnterior = dataMesAnterior.getMonth();
    const anoMesAnterior = dataMesAnterior.getFullYear();

    const nomeMesOriginal = hoje.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
    });
    const nomeMes =
        nomeMesOriginal.charAt(0).toUpperCase() + nomeMesOriginal.slice(1);

    const nomeMesAnteriorOriginal = dataMesAnterior.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
    });
    const nomeMesAnterior =
        nomeMesAnteriorOriginal.charAt(0).toUpperCase() +
        nomeMesAnteriorOriginal.slice(1);

    if (mesAtualInicio) {
        mesAtualInicio.innerHTML = "📅 " + nomeMes;
    }

    if (quantidadeInicio) {
        quantidadeInicio.innerHTML = "📝 Lançamentos: " + dados.length;
    }

    dados.forEach(item => {
        const data = new Date(item.data);
        const mes = data.getMonth();
        const ano = data.getFullYear();

        if (mes === numeroMes && ano === anoAtual) {
            if (item.tipo === "receita") {
                receitas += Number(item.valor);
            }
            if (item.tipo === "despesa") {
                despesas += Number(item.valor);
                if (item.status === "pendente") {
                    pendentes += Number(item.valor);
                }
            }
        }

        if (mes === numeroMesAnterior && ano === anoMesAnterior) {
            if (item.tipo === "receita") {
                receitasAnterior += Number(item.valor);
            }
            if (item.tipo === "despesa") {
                despesasAnterior += Number(item.valor);
            }
        }
    });

    const mesAnteriorComparativo = document.getElementById("mesAnteriorComparativo");
    const mesAtualComparativo = document.getElementById("mesAtualComparativo");
    const gastosMesAnterior = document.getElementById("gastosMesAnterior");
    const receitasMesAnterior = document.getElementById("receitasMesAnterior");
    const gastosMesAtual = document.getElementById("gastosMesAtual");
    const receitasMesAtual = document.getElementById("receitasMesAtual");

    if (mesAnteriorComparativo) mesAnteriorComparativo.innerHTML = nomeMesAnterior;
    if (mesAtualComparativo) mesAtualComparativo.innerHTML = nomeMes;
    if (gastosMesAnterior) gastosMesAnterior.innerHTML = `R$ ${moeda(despesasAnterior)}`;
    if (receitasMesAnterior) receitasMesAnterior.innerHTML = `R$ ${moeda(receitasAnterior)}`;
    if (gastosMesAtual) gastosMesAtual.innerHTML = `R$ ${moeda(despesas)}`;
    if (receitasMesAtual) receitasMesAtual.innerHTML = `R$ ${moeda(receitas)}`;

    const saldo = receitas - despesas;

    if (saldoInicio) saldoInicio.innerHTML = `📊 Saldo do mês: R$ ${moeda(saldo)}`;
    if (receitasInicio) receitasInicio.innerHTML = `💰 Receitas: R$ ${moeda(receitas)}`;
    if (despesasInicio) despesasInicio.innerHTML = `💸 Despesas: R$ ${moeda(despesas)}`;
    if (pendenciasInicio) pendenciasInicio.innerHTML = `⚠️ Pendentes do mês: R$ ${moeda(pendentes)}`;

    atualizarResumoInteligente();
}

function atualizarResumoInteligente() {
    const dados = carregarDados();
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    let gastos = 0;
    let receitas = 0;
    let categorias = {};
    let pagamentos = {};

    dados.forEach(item => {
        const data = new Date(item.data);

        if (data.getMonth() === mesAtual && data.getFullYear() === anoAtual) {
            if (item.tipo === "despesa") {
                gastos += Number(item.valor);

                categorias[item.categoria] =
                    (categorias[item.categoria] || 0) + Number(item.valor);

                const pagamento = item.formaPagamento || "Não informado";
                pagamentos[pagamento] =
                    (pagamentos[pagamento] || 0) + Number(item.valor);
            }

            if (item.tipo === "receita") {
                receitas += Number(item.valor);
            }
        }
    });

    let categoriaMaior = "-";
    let valorMaior = 0;

    for (let categoria in categorias) {
        if (categorias[categoria] > valorMaior) {
            valorMaior = categorias[categoria];
            categoriaMaior = categoria;
        }
    }

    if (gastosMes) gastosMes.innerHTML = `R$ ${moeda(gastos)}`;
    if (receitasMes) receitasMes.innerHTML = `R$ ${moeda(receitas)}`;
    if (resultadoMes) resultadoMes.innerHTML = `📊 Resultado: R$ ${moeda(receitas - gastos)}`;

    const cardMaiorGasto = document.getElementById("maiorGasto");
    if (cardMaiorGasto) {
        cardMaiorGasto.innerHTML = `🏆 Maior gasto: ${categoriaMaior} • R$ ${moeda(valorMaior)}`;
    }

    const resumoCategorias = document.getElementById("resumoCategorias");
    if (resumoCategorias) {
        resumoCategorias.innerHTML =
            Object.entries(categorias)
                .sort(([, a], [, b]) => b - a)
                .map(([categoria, valor]) => {
                    const porcentagem =
                        gastos > 0 ? Math.round((valor / gastos) * 100) : 0;

                    return `
                        <div class="linhaResumo">
                            <span>🏷️ ${categoria}</span>
                            <span>
                                R$ ${moeda(valor)}
                                <strong>${porcentagem}%</strong>
                            </span>
                        </div>
                    `;
                })
                .join("") || "Nenhum gasto registrado.";
    }

    const resumoPagamentos = document.getElementById("resumoPagamentos");
    if (resumoPagamentos) {
        resumoPagamentos.innerHTML =
            Object.entries(pagamentos)
                .sort(([, a], [, b]) => b - a)
                .map(([pagamento, valor]) => {
                    const porcentagem =
                        gastos > 0 ? Math.round((valor / gastos) * 100) : 0;

                    return `
                        <div class="linhaResumo">
                            <span>💳 ${pagamento}</span>
                            <span>
                                R$ ${moeda(valor)}
                                <strong>${porcentagem}%</strong>
                            </span>
                        </div>
                    `;
                })
                .join("") || "Nenhum gasto registrado.";
    }
}

/* ==========================================================
   RENDERIZAÇÃO DO HISTÓRICO
========================================================== */

function renderizar() {
    let dados = carregarDados();

    let totalDespesas = 0;
    let totalReceitas = 0;
    let totalPendente = 0;

    if (filtroMes.value) {
        dados = dados.filter(item => {
            const data = new Date(item.data);
            const ano = data.getFullYear();
            const mes = String(data.getMonth() + 1).padStart(2, "0");
            return `${ano}-${mes}` === filtroMes.value;
        });
    }

    if (buscar.value.trim() !== "") {
        const normalizar = texto =>
            String(texto ?? "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();

        const texto = normalizar(buscar.value.trim());

        dados = dados.filter(item => {
            const informacoes = normalizar(JSON.stringify(item));
            return informacoes.includes(texto);
        });
    }

    dados.forEach(item => {
        if (item.tipo === "receita") {
            totalReceitas += Number(item.valor);
        }

        if (item.tipo === "despesa") {
            totalDespesas += Number(item.valor);
            if (item.status === "pendente") {
                totalPendente += Number(item.valor);
            }
        }
    });

    dados.sort((a, b) => {
        if (ordenacao.value === "maiorValor") {
            return b.valor - a.valor;
        }
        if (ordenacao.value === "menorValor") {
            return a.valor - b.valor;
        }
        if (ordenacao.value === "pendente") {
            return (a.status === "pago") - (b.status === "pago");
        }
        return new Date(b.data) - new Date(a.data);
    });

    lista.innerHTML = "";

    totalDespesasMes.innerHTML = `💸 Total de despesas: R$ ${moeda(totalDespesas)}`;
    totalReceitasMes.innerHTML = `💰 Total de receitas: R$ ${moeda(totalReceitas)}`;
    saldoMes.innerHTML = `📊 Saldo: R$ ${moeda(totalReceitas - totalDespesas)}`;
    totalPendenteMes.innerHTML = `⚠️ Pendente: R$ ${moeda(totalPendente)}`;

    if (dados.length === 0) {
        lista.innerHTML = "<p>Nenhum registro encontrado.</p>";
        return;
    }

    dados.forEach(item => {
        const div = criarTransacao(item);

        if (item.status === "pago") {
            div.style.borderLeft = "5px solid #43a047";
        } else {
            div.style.borderLeft = "5px solid #fbc02d";
        }

        lista.appendChild(div);
    });
}

/* ==========================================================
   ALTERAR STATUS
========================================================== */

function alterarStatus(id) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);

    if (!registro) return;

    registro.status = registro.status === "pago" ? "pendente" : "pago";

    salvarDados(dados);
    atualizarInicio();
    renderizar();
}

/* ==========================================================
   EXCLUIR REGISTRO INDIVIDUAL
========================================================== */

async function excluirRegistro(id) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);

    if (!registro) return;

    if (registro.parcela) {
        excluirGrupo(id);
        return;
    }

    if (!registro.recorrente && !registro.parcela) {
        const opcao = await abrirModalOpcoes({
            titulo: "🗑️ Excluir lançamento",
            texto: "Tem certeza que deseja excluir este lançamento?",
            opcoes: [
                { valor: "1", texto: "🗑️ Excluir este lançamento", perigo: true }
            ]
        });

        if (!opcao) return;

        const novosDados = dados.filter(item => String(item.id) !== String(id));
        salvarDados(novosDados);
        atualizarInicio();
        renderizar();
        return;
    }

    const opcao = await abrirModalOpcoes({
        titulo: "🗑️ Excluir recorrência",
        texto: "Este lançamento faz parte de uma recorrência. O que deseja excluir?",
        opcoes: [
            { valor: "1", texto: "Excluir somente este mês" },
            { valor: "2", texto: "Excluir este mês e os próximos" },
            { valor: "3", texto: "Excluir este mês e os anteriores" },
            { valor: "4", texto: "Excluir toda a recorrência", perigo: true }
        ]
    });

    if (!opcao) return;

    const dataRegistro = new Date(registro.data);
    const ano = dataRegistro.getFullYear();
    const mes = dataRegistro.getMonth();
    const chaveMes = `${ano}-${String(mes + 1).padStart(2, "0")}`;

    const recorrencias = carregarRecorrencias();
    const recorrencia = recorrencias.find(
        item => String(item.id) === String(registro.recorrenciaId)
    );

    if (!recorrencia) return;

    if (opcao === "1") {
        if (!recorrencia.excluidos) recorrencia.excluidos = [];
        if (!recorrencia.excluidos.includes(chaveMes)) {
            recorrencia.excluidos.push(chaveMes);
        }

        salvarRecorrencias(recorrencias);
        salvarDados(dados.filter(item => String(item.id) !== String(id)));
        atualizarInicio();
        renderizar();
        return;
    }

    if (opcao === "2") {
        const mesAnterior = new Date(ano, mes - 1, 1);
        const fim = `${mesAnterior.getFullYear()}-${String(
            mesAnterior.getMonth() + 1
        ).padStart(2, "0")}`;

        recorrencia.fim = fim;
        salvarRecorrencias(recorrencias);

        const novosDados = dados.filter(item => {
            if (String(item.recorrenciaId) !== String(registro.recorrenciaId)) {
                return true;
            }
            return new Date(item.data) < dataRegistro;
        });

        salvarDados(novosDados);
        atualizarInicio();
        renderizar();
        return;
    }

    if (opcao === "3") {
        if (!recorrencia.excluidos) recorrencia.excluidos = [];

        const inicio = new Date(recorrencia.inicio);
        let anoAtual = inicio.getFullYear();
        let mesAtual = inicio.getMonth();

        while (anoAtual < ano || (anoAtual === ano && mesAtual <= mes)) {
            const chave = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}`;
            if (!recorrencia.excluidos.includes(chave)) {
                recorrencia.excluidos.push(chave);
            }
            mesAtual++;
            if (mesAtual > 11) {
                mesAtual = 0;
                anoAtual++;
            }
        }

        salvarRecorrencias(recorrencias);
        salvarDados(
            dados.filter(item => {
                if (String(item.recorrenciaId) !== String(registro.recorrenciaId)) {
                    return true;
                }
                return new Date(item.data) > dataRegistro;
            })
        );
        atualizarInicio();
        renderizar();
        return;
    }

    if (opcao === "4") {
        const novasRecorrencias = recorrencias.filter(
            item => String(item.id) !== String(registro.recorrenciaId)
        );

        salvarRecorrencias(novasRecorrencias);
        salvarDados(
            dados.filter(
                item => String(item.recorrenciaId) !== String(registro.recorrenciaId)
            )
        );
        atualizarInicio();
        renderizar();
        return;
    }
}

/* ==========================================================
   EXCLUIR GRUPO DE PARCELAS
========================================================== */

async function excluirGrupo(id) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);

    if (!registro) return;

    if (!registro.parcela) {
        excluirRegistro(id);
        return;
    }

    const partes = registro.parcela.split("/");
    const numeroParcela = Number(partes[0]);

    const opcao = await abrirModalOpcoes({
        titulo: "🗑️ Excluir parcelamento",
        texto: "Este lançamento faz parte de um parcelamento. O que deseja excluir?",
        opcoes: [
            { valor: "1", texto: "Excluir somente esta parcela" },
            { valor: "2", texto: "Excluir esta e as próximas" },
            { valor: "3", texto: "Excluir esta e as anteriores" },
            { valor: "4", texto: "Excluir todas as parcelas", perigo: true }
        ]
    });

    if (!opcao) return;

    const grupo = String(registro.grupo);

    if (opcao === "1") {
        salvarDados(dados.filter(item => String(item.id) !== String(id)));
        atualizarInicio();
        renderizar();
        return;
    }

    if (opcao === "2") {
        salvarDados(
            dados.filter(item => {
                if (String(item.grupo) !== grupo) return true;
                const partesItem = item.parcela ? item.parcela.split("/") : [];
                return Number(partesItem[0]) < numeroParcela;
            })
        );
        atualizarInicio();
        renderizar();
        return;
    }

    if (opcao === "3") {
        salvarDados(
            dados.filter(item => {
                if (String(item.grupo) !== grupo) return true;
                const partesItem = item.parcela ? item.parcela.split("/") : [];
                return Number(partesItem[0]) > numeroParcela;
            })
        );
        atualizarInicio();
        renderizar();
        return;
    }

    if (opcao === "4") {
        salvarDados(dados.filter(item => String(item.grupo) !== grupo));
        atualizarInicio();
        renderizar();
        return;
    }
}

/* ==========================================================
   SALVAR OBSERVAÇÃO
========================================================== */

function salvarObservacao(id, texto) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);

    if (!registro) return;

    registro.observacao = texto.trim();
    salvarDados(dados);
}

/* ==========================================================
   LIMPAR FILTRO
========================================================== */

function limparFiltro() {
    filtroMes.value = "";
    renderizar();
}

/* ==========================================================
   INICIALIZAÇÃO DO APP
========================================================== */

function iniciarApp() {
    inputDataLancamento.value = new Date().toISOString().split("T")[0];

    const hoje = new Date();
    filtroMes.value =
        hoje.getFullYear() +
        "-" +
        String(hoje.getMonth() + 1).padStart(2, "0");

    atualizarMesExibido();
    gerarRecorrenciasDoMes();
    atualizarInicio();
    atualizarResumoInteligente();
    renderizar();
}

/* ==========================================================
   EXECUÇÃO INICIAL
========================================================== */

iniciarApp();

/* ==========================================================
   TEMA ESCURO
========================================================== */

const botaoTema = document.getElementById("toggleThemeConfig");

if (botaoTema) {
    botaoTema.addEventListener("click", () => {
        document.body.classList.toggle("dark");

        if (document.body.classList.contains("dark")) {
            localStorage.setItem("tema", "dark");
            botaoTema.innerText = "☀️ Tema claro";
        } else {
            localStorage.setItem("tema", "light");
            botaoTema.innerText = "🌙 Tema escuro";
        }
    });
}

const temaSalvo = localStorage.getItem("tema");

if (temaSalvo === "dark") {
    document.body.classList.add("dark");
    if (botaoTema) {
        botaoTema.innerText = "☀️ Tema claro";
    }
}

/* ==========================================================
   NAVEGAÇÃO ENTRE TELAS
========================================================== */

let telaExtraNoHistorico = false;

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

    if (id === "telaResumo") {
        renderizar();
    }

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
            telaLancamentos: 1,
            telaResumo: 2,
            telaMetas: 3,
            telaConfiguracoes: 4
        };

        const indice = mapa[id];
        if (indice !== undefined) {
            document.querySelectorAll(".itemMenu")[indice].classList.add("ativo");
        }
    }
}

/* ==========================================================
   BACKUP
========================================================== */

const botaoBackup = document.getElementById("btnBackup");

if (botaoBackup) {
    botaoBackup.addEventListener("click", () => {
        const dados = carregarDados();
        const metas = carregarMetas();
        const recorrencias = carregarRecorrencias();

        const arquivo = JSON.stringify(
            {
                lancamentos: dados,
                metas: metas,
                recorrencias: recorrencias
            },
            null,
            2
        );

        const blob = new Blob([arquivo], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "backup_controle_financeiro.json";
        link.click();

        URL.revokeObjectURL(url);
    });
}

/* ==========================================================
   RESTAURAR BACKUP
========================================================== */

const botaoRestaurar = document.getElementById("btnRestaurar");
const arquivoBackup = document.getElementById("arquivoBackup");

if (botaoRestaurar) {
    botaoRestaurar.addEventListener("click", () => {
        arquivoBackup.click();
    });
}

if (arquivoBackup) {
    arquivoBackup.addEventListener("change", (evento) => {
        const arquivo = evento.target.files[0];
        if (!arquivo) return;

        const leitor = new FileReader();

        leitor.onload = function(e) {
            try {
                const dados = JSON.parse(e.target.result);

                if (Array.isArray(dados)) {
                    salvarDados(dados);
                } else {
                    salvarDados(dados.lancamentos || []);
                    salvarMetas(dados.metas || []);
                    salvarRecorrencias(dados.recorrencias || []);
                }

                alert("Backup restaurado com sucesso!");
                atualizarInicio();
                renderizar();
            } catch {
                alert("Arquivo de backup inválido!");
            }
        };

        leitor.readAsText(arquivo);
    });
}

/* ==========================================================
   SISTEMA DE METAS
========================================================== */

const STORAGE_METAS = "controle_metas";
let metaAtualId = null;

function carregarMetas() {
    return JSON.parse(localStorage.getItem(STORAGE_METAS) || "[]");
}

function salvarMetas(metas) {
    localStorage.setItem(STORAGE_METAS, JSON.stringify(metas));
}

function encontrarMeta(id) {
    const metas = carregarMetas();
    return metas.find(meta => String(meta.id) === String(id));
}

async function abrirFormularioMeta() {
    const resposta = await abrirModalFormulario({
        titulo: "🎯 Nova meta",
        campos: [
            {
                id: "nome",
                label: "Nome da meta",
                placeholder: "Ex: Reserva de emergência"
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
        alert("Digite o nome da meta.");
        return;
    }

    const valorTexto = resposta.valor;
    if (!valorTexto) {
        alert("Digite o valor da meta.");
        return;
    }

    const valorMeta = Number(
        valorTexto.replace(/\./g, "").replace(",", ".")
    );

    if (!valorMeta || valorMeta <= 0) {
        alert("Digite um valor de meta válido.");
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
            alert("Digite um valor válido.");
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

function excluirAporte(id) {
    if (!confirm("Deseja excluir este valor?")) return;

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

function excluirMetaAtual() {
    const meta = encontrarMeta(metaAtualId);
    if (!meta) return;

    if (
        !confirm(
            `Deseja excluir a meta "${meta.nome}"?\n\nTodos os valores registrados nela também serão excluídos.`
        )
    ) {
        return;
    }

    let metas = carregarMetas();
    metas = metas.filter(item => String(item.id) !== String(metaAtualId));

    salvarMetas(metas);
    metaAtualId = null;

    mostrarTela("telaMetas");
    renderizarMetas();
}

const mostrarTelaOriginal = mostrarTela;

mostrarTela = function(id, botao = null) {
    mostrarTelaOriginal(id, botao);

    if (id === "telaMetas") {
        renderizarMetas();
    }
    if (id === "telaDetalheMeta") {
        renderizarDetalheMeta();
    }
};

/* ==========================================================
   CALCULADORA DO CAMPO VALOR
========================================================== */

let expressaoCalc = "";

function teclaCalc(tecla) {
    expressaoCalc += tecla;
    document.getElementById("valor").value = expressaoCalc;

    const resultado = calcularExpressao(expressaoCalc);
    document.getElementById("resultadoTeclado").innerText =
        resultado !== null ? "R$ " + moeda(resultado) : expressaoCalc;
}

function apagarCalc() {
    expressaoCalc = expressaoCalc.slice(0, -1);
    document.getElementById("valor").value = expressaoCalc;
    atualizarTeclado();
}

function limparCalc() {
    expressaoCalc = "";
    document.getElementById("valor").value = "";
    document.getElementById("resultadoTeclado").innerText = "R$ 0,00";
}

function atualizarTeclado() {
    const resultado = calcularExpressao(expressaoCalc);
    document.getElementById("resultadoTeclado").innerText =
        resultado !== null
            ? "R$ " + moeda(resultado)
            : expressaoCalc || "R$ 0,00";
}

function finalizarCalc() {
    const resultado = calcularExpressao(expressaoCalc);

    if (resultado === null) {
        alert("Conta inválida.");
        return;
    }

    expressaoCalc = String(resultado).replace(".", ",");
    document.getElementById("valor").value = moeda(resultado);
    document.getElementById("resultadoTeclado").innerText = "R$ " + moeda(resultado);
}

document.addEventListener("click", function(evento) {
    const teclado = document.getElementById("tecladoValor");
    if (!teclado) return;

    if (!teclado.contains(evento.target) && evento.target.id !== "valor") {
        teclado.style.display = "none";
    }
});

/* ==========================================================
   SISTEMA DE CATEGORIAS
========================================================== */

const STORAGE_CATEGORIAS = "controle_categorias";

const categoriasPadrao = [
    { nome: "Alimentação", icone: "🍔" },
    { nome: "Transporte", icone: "🚗" },
    { nome: "Lazer", icone: "🎮" },
    { nome: "Moradia", icone: "🏠" },
    { nome: "Saúde", icone: "💊" },
    { nome: "Salário", icone: "💰" },
    { nome: "Outros", icone: "📦" }
];

function carregarCategorias() {
    let categorias = JSON.parse(
        localStorage.getItem(STORAGE_CATEGORIAS) || "null"
    );

    if (!categorias) {
        categorias = categoriasPadrao;
        localStorage.setItem(STORAGE_CATEGORIAS, JSON.stringify(categorias));
    }

    return categorias;
}

function salvarCategorias(categorias) {
    localStorage.setItem(STORAGE_CATEGORIAS, JSON.stringify(categorias));
}

function renderizarCategorias() {
    const lista = document.getElementById("listaCategorias");
    if (!lista) return;

    const categorias = carregarCategorias();
    lista.innerHTML = "";

    categorias.forEach((categoria, index) => {
        const div = document.createElement("div");
        div.className = "itemGerenciado";

        div.innerHTML = `
            <div class="linhaGerenciado">
                <strong class="nomeGerenciado">${categoria.icone} ${categoria.nome}</strong>
                <div class="acoesGerenciado">
                    <button onclick="editarCategoria(${index})">✏️</button>
                    <button onclick="excluirCategoria(${index})">🗑️</button>
                </div>
            </div>
        `;

        lista.appendChild(div);
    });
}

async function adicionarCategoria() {
    const resposta = await abrirModalFormulario({
        titulo: "🏷️ Nova categoria",
        campos: [
            {
                id: "nome",
                label: "Nome da categoria",
                placeholder: "Ex: Educação"
            },
            {
                id: "icone",
                label: "Emoji (opcional)",
                placeholder: "Ex: 📚"
            }
        ],
        textoConfirmar: "Salvar"
    });

    if (!resposta) return;

    if (!resposta.nome || !resposta.nome.trim()) {
        alert("Digite o nome da categoria.");
        return;
    }

    const categorias = carregarCategorias();
    categorias.push({
        nome: resposta.nome.trim(),
        icone: (resposta.icone || "").trim()
    });

    salvarCategorias(categorias);
    renderizarCategorias();
    atualizarCategoriasLancamento();
}

async function editarCategoria(index) {
    const categorias = carregarCategorias();
    const categoria = categorias[index];
    const nomeAntigo = categoria.nome;

    const resposta = await abrirModalFormulario({
        titulo: "✏️ Editar categoria",
        campos: [
            {
                id: "nome",
                label: "Nome da categoria",
                valorInicial: nomeAntigo
            },
            {
                id: "icone",
                label: "Emoji (opcional)",
                valorInicial: categoria.icone || ""
            }
        ],
        textoConfirmar: "Atualizar"
    });

    if (!resposta) return;

    if (!resposta.nome || !resposta.nome.trim()) {
        alert("Digite o nome da categoria.");
        return;
    }

    const nomeNovo = resposta.nome.trim();
    categoria.nome = nomeNovo;
    categoria.icone = (resposta.icone || "").trim();

    salvarCategorias(categorias);

    const dados = carregarDados();
    dados.forEach(item => {
        if (item.categoria === nomeAntigo) {
            item.categoria = nomeNovo;
        }
    });
    salvarDados(dados);

    renderizarCategorias();
    atualizarCategoriasLancamento();
    atualizarInicio();
    renderizar();
}

async function excluirCategoria(index) {
    const categorias = carregarCategorias();
    const categoria = categorias[index];
    const dados = carregarDados();

    const quantidade = dados.filter(
        item => item.categoria === categoria.nome
    ).length;

    if (quantidade === 0) {
        const confirmar = await abrirModalOpcoes({
            titulo: "🗑️ Excluir categoria",
            texto: `Deseja excluir a categoria "${categoria.nome}"?`,
            opcoes: [
                { valor: "sim", texto: "🗑️ Excluir categoria", perigo: true }
            ]
        });

        if (!confirmar) return;

        categorias.splice(index, 1);
        salvarCategorias(categorias);
        renderizarCategorias();
        atualizarCategoriasLancamento();
        return;
    }

    const opcao = await abrirModalOpcoes({
        titulo: "🗑️ Excluir categoria",
        texto: `A categoria "${categoria.nome}" possui ${quantidade} lançamento(s). O que deseja fazer com eles?`,
        opcoes: [
            { valor: "1", texto: "Transferir para outra categoria" },
            { valor: "2", texto: "Manter os lançamentos sem categoria" }
        ]
    });

    if (!opcao) return;

    if (opcao === "1") {
        const outrasCategorias = categorias.filter((_, i) => i !== index);

        if (outrasCategorias.length === 0) {
            alert("Não existe outra categoria para transferir os lançamentos.");
            return;
        }

        const escolhaNome = await abrirModalOpcoes({
            titulo: "🏷️ Escolher nova categoria",
            texto: "Para qual categoria deseja transferir os lançamentos?",
            opcoes: outrasCategorias.map(cat => ({
                valor: cat.nome,
                texto: `${cat.icone ? cat.icone + " " : ""}${cat.nome}`
            }))
        });

        if (!escolhaNome) return;

        dados.forEach(item => {
            if (item.categoria === categoria.nome) {
                item.categoria = escolhaNome;
            }
        });
        salvarDados(dados);
    }

    if (opcao === "2") {
        dados.forEach(item => {
            if (item.categoria === categoria.nome) {
                item.categoria = "";
            }
        });
        salvarDados(dados);
    }

    categorias.splice(index, 1);
    salvarCategorias(categorias);
    renderizarCategorias();
    atualizarCategoriasLancamento();
    atualizarInicio();
    renderizar();
}

const mostrarTelaComCategorias = mostrarTela;

mostrarTela = function(id, botao = null) {
    mostrarTelaComCategorias(id, botao);

    if (id === "telaCategorias") {
        renderizarCategorias();
    }
};

function atualizarCategoriasLancamento() {
    const select = document.getElementById("categoria");
    if (!select) return;

    const valorAtual = select.value;
    const categorias = carregarCategorias();

    select.innerHTML =
        '<option value="" selected disabled>Selecione...</option>';

    categorias.forEach(categoria => {
        const option = document.createElement("option");
        option.value = categoria.nome;
        option.textContent = `${categoria.icone ? categoria.icone + " " : ""}${categoria.nome}`;
        select.appendChild(option);
    });

    if (categorias.some(c => c.nome === valorAtual)) {
        select.value = valorAtual;
    }
}

atualizarCategoriasLancamento();

/* ==========================================================
   FORMAS DE PAGAMENTO
========================================================== */

const STORAGE_FORMAS_PAGAMENTO = "controle_formas_pagamento";

const formasPagamentoPadrao = [
    { nome: "Dinheiro", icone: "💵" },
    { nome: "Cartão de débito", icone: "💳" },
    { nome: "Cartão de crédito", icone: "💳" }
];

function carregarFormasPagamento() {
    let formas = JSON.parse(
        localStorage.getItem(STORAGE_FORMAS_PAGAMENTO) || "null"
    );

    if (!formas) {
        formas = formasPagamentoPadrao;
        localStorage.setItem(STORAGE_FORMAS_PAGAMENTO, JSON.stringify(formas));
    }

    return formas;
}

function salvarFormasPagamento(formas) {
    localStorage.setItem(STORAGE_FORMAS_PAGAMENTO, JSON.stringify(formas));
}

function atualizarFormasPagamentoLancamento() {
    const select = document.getElementById("formaPagamento");
    if (!select) return;

    const valorAtual = select.value;
    const formas = carregarFormasPagamento();

    select.innerHTML =
        '<option value="" selected disabled>Selecione...</option>';

    formas.forEach(forma => {
        const option = document.createElement("option");
        option.value = forma.nome;
        option.textContent = `${forma.icone ? forma.icone + " " : ""}${forma.nome}`;
        select.appendChild(option);
    });

    if (formas.some(forma => forma.nome === valorAtual)) {
        select.value = valorAtual;
    }
}

function renderizarFormasPagamento() {
    const lista = document.getElementById("listaFormasPagamento");
    if (!lista) return;

    const formas = carregarFormasPagamento();
    lista.innerHTML = "";

    formas.forEach((forma, index) => {
        const div = document.createElement("div");
        div.className = "itemGerenciado";

        div.innerHTML = `
            <div class="linhaGerenciado">
                <strong class="nomeGerenciado">${forma.icone} ${forma.nome}</strong>
                <div class="acoesGerenciado">
                    <button onclick="editarFormaPagamento(${index})">✏️</button>
                    <button onclick="excluirFormaPagamento(${index})">🗑️</button>
                </div>
            </div>
        `;

        lista.appendChild(div);
    });
}

async function adicionarFormaPagamento() {
    const resposta = await abrirModalFormulario({
        titulo: "💳 Nova forma de pagamento",
        campos: [
            {
                id: "nome",
                label: "Nome da forma de pagamento",
                placeholder: "Ex: Pix"
            },
            {
                id: "icone",
                label: "Emoji (opcional)",
                placeholder: "Ex: ⚡"
            }
        ],
        textoConfirmar: "Salvar"
    });

    if (!resposta) return;

    if (!resposta.nome || !resposta.nome.trim()) {
        alert("Digite o nome da forma de pagamento.");
        return;
    }

    const formas = carregarFormasPagamento();
    formas.push({
        nome: resposta.nome.trim(),
        icone: (resposta.icone || "").trim()
    });

    salvarFormasPagamento(formas);
    renderizarFormasPagamento();
    atualizarFormasPagamentoLancamento();
}

async function editarFormaPagamento(index) {
    const formas = carregarFormasPagamento();
    const forma = formas[index];
    const nomeAntigo = forma.nome;

    const resposta = await abrirModalFormulario({
        titulo: "✏️ Editar forma de pagamento",
        campos: [
            {
                id: "nome",
                label: "Nome da forma de pagamento",
                valorInicial: nomeAntigo
            },
            {
                id: "icone",
                label: "Emoji (opcional)",
                valorInicial: forma.icone || ""
            }
        ],
        textoConfirmar: "Atualizar"
    });

    if (!resposta) return;

    if (!resposta.nome || !resposta.nome.trim()) {
        alert("Digite o nome da forma de pagamento.");
        return;
    }

    const nomeNovo = resposta.nome.trim();
    forma.nome = nomeNovo;
    forma.icone = (resposta.icone || "").trim();

    salvarFormasPagamento(formas);

    const dados = carregarDados();
    dados.forEach(item => {
        if (item.formaPagamento === nomeAntigo) {
            item.formaPagamento = nomeNovo;
        }
    });
    salvarDados(dados);

    renderizarFormasPagamento();
    atualizarFormasPagamentoLancamento();
    atualizarInicio();
    renderizar();
}

async function excluirFormaPagamento(index) {
    const formas = carregarFormasPagamento();
    const forma = formas[index];
    const dados = carregarDados();

    const quantidade = dados.filter(
        item => item.formaPagamento === forma.nome
    ).length;

    if (quantidade === 0) {
        const confirmar = await abrirModalOpcoes({
            titulo: "🗑️ Excluir forma de pagamento",
            texto: `Deseja excluir "${forma.nome}"?`,
            opcoes: [
                { valor: "sim", texto: "🗑️ Excluir forma de pagamento", perigo: true }
            ]
        });

        if (!confirmar) return;

        formas.splice(index, 1);
        salvarFormasPagamento(formas);
        renderizarFormasPagamento();
        atualizarFormasPagamentoLancamento();
        return;
    }

    const opcao = await abrirModalOpcoes({
        titulo: "🗑️ Excluir forma de pagamento",
        texto: `A forma "${forma.nome}" possui ${quantidade} lançamento(s). O que deseja fazer com eles?`,
        opcoes: [
            { valor: "1", texto: "Transferir para outra forma" },
            { valor: "2", texto: "Deixar os lançamentos sem forma" }
        ]
    });

    if (!opcao) return;

    if (opcao === "1") {
        const outrasFormas = formas.filter((_, i) => i !== index);

        if (outrasFormas.length === 0) {
            alert("Não existe outra forma para transferir os lançamentos.");
            return;
        }

        const escolhaNome = await abrirModalOpcoes({
            titulo: "💳 Escolher nova forma",
            texto: "Para qual forma de pagamento deseja transferir os lançamentos?",
            opcoes: outrasFormas.map(f => ({
                valor: f.nome,
                texto: `${f.icone ? f.icone + " " : ""}${f.nome}`
            }))
        });

        if (!escolhaNome) return;

        dados.forEach(item => {
            if (item.formaPagamento === forma.nome) {
                item.formaPagamento = escolhaNome;
            }
        });
        salvarDados(dados);
    }

    if (opcao === "2") {
        dados.forEach(item => {
            if (item.formaPagamento === forma.nome) {
                item.formaPagamento = "";
            }
        });
        salvarDados(dados);
    }

    formas.splice(index, 1);
    salvarFormasPagamento(formas);
    renderizarFormasPagamento();
    atualizarFormasPagamentoLancamento();
    atualizarInicio();
    renderizar();
}

const mostrarTelaComFormasPagamento = mostrarTela;

mostrarTela = function(id, botao = null) {
    mostrarTelaComFormasPagamento(id, botao);

    if (id === "telaFormasPagamento") {
        renderizarFormasPagamento();
    }
};

atualizarFormasPagamentoLancamento();

document.addEventListener("DOMContentLoaded", () => {
    atualizarFormasPagamentoLancamento();
});

/* ==========================================================
   POP-UP INFORMATIVO DO RESUMO
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

/* ==========================================================
   MODAIS DO APP
========================================================== */

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
            label.innerText = campo.label;

            const input = document.createElement("input");
            input.type = campo.type || "text";
            input.value = campo.valorInicial || "";
            input.placeholder = campo.placeholder || "";
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