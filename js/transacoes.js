/* ==========================================================
   TELA DE TRANSAÇÕES (HISTÓRICO, FILTROS E AÇÕES)
========================================================== */

filtroMes.addEventListener("change", () => {
    atualizarMesExibido();
    gerarRecorrenciasDoMes();
    renderizar();
});

buscar.addEventListener("input", renderizar);
ordenacao.addEventListener("change", renderizar);

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

function limparFiltro() {
    filtroMes.value = "";
    renderizar();
}

function abrirTransacoesFiltradas(textoCodificado, tipoFiltro = "todos") {
    const hoje = new Date();
    filtroMes.value =
        mesInicioAtual ||
        `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
    atualizarMesExibido();

    buscar.value = decodeURIComponent(textoCodificado);

    const botoes = document.querySelectorAll(".btnFiltroRapido");
    let botaoAlvo = botoes[0] || null;

    botoes.forEach(btn => {
        if (btn.getAttribute("onclick")?.includes(`'${tipoFiltro}'`)) {
            botaoAlvo = btn;
        }
    });

    definirFiltroRapido(tipoFiltro, botaoAlvo);
    mostrarTela("telaResumo");
}

function limparFiltrosLista() {
    buscar.value = "";
    const primeiroBotao = document.querySelector(".btnFiltroRapido");
    definirFiltroRapido("todos", primeiroBotao);
}

function definirFiltroRapido(tipo, botao) {
    filtroRapidoAtual = tipo;

    document.querySelectorAll(".btnFiltroRapido").forEach(btn => {
        btn.classList.remove("ativo");
    });

    if (botao) {
        botao.classList.add("ativo");
    }

    renderizar();
}

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
            const dataFormatada = new Date(item.data).toLocaleDateString("pt-BR");
            const camposBusca = [
                item.descricao,
                item.categoria || "Sem categoria",
                item.formaPagamento || "Não informado",
                item.observacao,
                item.parcela,
                item.status,
                item.tipo,
                dataFormatada,
                String(item.valor),
                moeda(item.valor)
            ].join(" ");

            return normalizar(camposBusca).includes(texto);
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

    if (filtroRapidoAtual === "pendentes") {
        dados = dados.filter(item => item.status === "pendente");
    } else if (filtroRapidoAtual === "despesas") {
        dados = dados.filter(item => item.tipo === "despesa");
    } else if (filtroRapidoAtual === "receitas") {
        dados = dados.filter(item => item.tipo === "receita");
    }

    dados.sort((a, b) => {
        if (ordenacao.value === "maiorValor") return b.valor - a.valor;
        if (ordenacao.value === "menorValor") return a.valor - b.valor;
        if (ordenacao.value === "pendente") return (a.status === "pago") - (b.status === "pago");
        return new Date(b.data) - new Date(a.data);
    });

    lista.innerHTML = "";

    totalDespesasMes.innerHTML = `💸 Total de despesas: R$ ${moeda(totalDespesas)}`;
    totalReceitasMes.innerHTML = `💰 Total de receitas: R$ ${moeda(totalReceitas)}`;
    const saldoCalculado = totalReceitas - totalDespesas;
    saldoMes.innerHTML = `📊 Saldo: R$ ${moeda(saldoCalculado)}`;
    saldoMes.classList.toggle("saldoNegativo", saldoCalculado < 0);
    totalPendenteMes.innerHTML = `⚠️ Pendente: R$ ${moeda(totalPendente)}`;

    const resumoFiltroLista = document.getElementById("resumoFiltroLista");
    if (resumoFiltroLista) {
        const temFiltroAtivo =
            buscar.value.trim() !== "" || filtroRapidoAtual !== "todos";

        if (!temFiltroAtivo) {
            resumoFiltroLista.innerHTML = "";
        } else {
            let somaDespesas = 0;
            let somaReceitas = 0;

            dados.forEach(item => {
                if (item.tipo === "receita") somaReceitas += Number(item.valor);
                else somaDespesas += Number(item.valor);
            });

            let textoTotal = "";
            if (somaReceitas > 0 && somaDespesas > 0) {
                textoTotal = `Saldo: R$ ${moeda(somaReceitas - somaDespesas)}`;
            } else if (somaReceitas > 0) {
                textoTotal = `Total: R$ ${moeda(somaReceitas)}`;
            } else {
                textoTotal = `Total: R$ ${moeda(somaDespesas)}`;
            }

            resumoFiltroLista.innerHTML = `
                <span>🔎 ${dados.length} registro(s) • <strong>${textoTotal}</strong></span>
                <button type="button" class="btnLimparFiltroLista" onclick="limparFiltrosLista()">✕ Limpar</button>
            `;
        }
    }

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

function criarTransacao(item) {
    const div = document.createElement("div");
    div.className = "transacao";

    div.innerHTML = `
        <div class="linha linhaPrincipal">
            <div class="titulo tituloTransacao">
                <span class="descricaoTransacao">${item.descricao}</span>
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
                ? `<div class="info observacaoCompacta" onclick="verObservacao('${item.id}')" title="Clique para ver completa">📝 ${item.observacao}</div>`
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
                <button onclick="duplicarRegistro('${item.id}')">
                    📋 Duplicar
                </button>
                <button onclick="excluirRegistro('${item.id}')">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `;

    return div;
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

function verObservacao(id) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);
    if (!registro || !registro.observacao) return;

    abrirModalAviso(registro.observacao, "📝 Observação");
}

function salvarObservacao(id, texto) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);
    if (!registro) return;

    registro.observacao = texto.trim();
    salvarDados(dados);
}

function alterarStatus(id) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);
    if (!registro) return;

    registro.status = registro.status === "pago" ? "pendente" : "pago";

    salvarDados(dados);
    atualizarInicio();
    renderizar();
}

async function excluirRegistro(id) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);
    if (!registro) return;

    document.querySelectorAll(".menuAcoes").forEach(menu => {
        menu.classList.remove("aberto");
    });

    if (registro.parcela) {
        excluirGrupo(id);
        return;
    }

    if (!registro.recorrente && !registro.parcela) {
        const opcao = await abrirModalOpcoes({
            titulo: "🗑️ Excluir lançamento",
            texto: `Tem certeza que deseja excluir "${registro.descricao}" (R$ ${moeda(registro.valor)})?`,
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