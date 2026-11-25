/* ==========================================================
   TELA DE LANÇAMENTOS E CALCULADORA
========================================================== */

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
        abrirModalAviso("Conta inválida.");
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

parcelado.addEventListener("change", () => {
    if (parcelado.value === "sim") {
        areaParcelas.style.display = "block";
    } else {
        areaParcelas.style.display = "none";
    }
});

form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const descricao = inputDescricao.value.trim();
    const valor = calcularExpressao(inputValor.value);

    if (valor === null || valor <= 0) {
        abrirModalAviso("Digite um valor ou uma conta válida.");
        return;
    }

    const tipo = selectTipo.value;
    const categoria = selectCategoria.value;
    const observacao = inputObservacao.value.trim();
    const formaPagamento = selectFormaPagamento.value;

    if (!tipo) {
        abrirModalAviso("Selecione o tipo (Despesa ou Receita).");
        return;
    }

    if (!categoria) {
        abrirModalAviso("Selecione uma categoria.");
        return;
    }

    if (!parcelado.value) {
        abrirModalAviso("Selecione a opção de repetição.");
        return;
    }

    if (!idEdicao && parcelado.value === "sim" && (!inputParcelas.value || Number(inputParcelas.value) < 2)) {
        abrirModalAviso("Digite uma quantidade de parcelas válida (mínimo 2).");
        return;
    }

    const dataEscolhida = inputDataLancamento.value;
    const agora = dataEscolhida
        ? new Date(dataEscolhida + "T12:00:00")
        : new Date();

    const dados = carregarDados();

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

    const tipoRepeticaoTexto =
        parcelado.value === "sim"
            ? inputParcelas.value + "x"
            : parcelado.value === "recorrente"
                ? "Recorrente"
                : "Não";

    const confirmar = await abrirModalConfirmacao({
        titulo: "💾 Salvar lançamento",
        texto:
            `Descrição: ${descricao}\n` +
            `Valor: R$ ${moeda(valor)}\n` +
            `Categoria: ${categoria}\n` +
            `Repetição: ${tipoRepeticaoTexto}`,
        textoConfirmar: "Salvar"
    });

    if (!confirmar) return;

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

function editarRegistro(id) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);
    if (!registro) return;

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

function duplicarRegistro(id) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);
    if (!registro) return;

    limparFormulario();

    inputDescricao.value = registro.descricao || "";
    expressaoCalc = String(registro.valor).replace(".", ",");
    inputValor.value = expressaoCalc;
    atualizarTeclado();

    inputDataLancamento.value = dataHojeLocal();
    selectTipo.value = registro.tipo || "";
    selectCategoria.value = registro.categoria || "";
    selectFormaPagamento.value = registro.formaPagamento || "";
    inputObservacao.value = registro.observacao || "";
    parcelado.value = "nao";
    areaParcelas.style.display = "none";

    document.querySelectorAll(".menuAcoes").forEach(menu => {
        menu.classList.remove("aberto");
    });

    mostrarTela("telaLancamentos");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

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

    inputDataLancamento.value = dataHojeLocal();
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