// ==UserScript==
// @name        Cadastro no Open4School
// @namespace   http://tampermonkey.net/
// @version     1.1
// @description Coleta dados de aluno do Sigeduca e envia para o Open4School.
// @author      Lucas Monteiro
// @author      Magno Rodrigo da Silva
// @match       http://sigeduca.seduc.mt.gov.br/ged/hwmconaluno.aspx
// @icon        https://www.google.com/s2/favicons?sz=64&domain=gov.br
// @require     https://code.jquery.com/jquery-3.6.0.min.js
// @updateURL    https://github.com/lksoumon/integraOpen4School/raw/refs/heads/main/Importa_turmas_open4School.user.js
// @downloadURL   https://github.com/lksoumon/integraOpen4School/raw/refs/heads/main/Importa_turmas_open4School.user.js
// @grant       none
// ==/UserScript==

// --- Estilos CSS ---
var styleSCT = document.createElement('style');
styleSCT.type = 'text/css';
styleSCT.innerHTML = `
    span.button-like {
        display: inline-block;
        padding: 10px 20px;
        background-color: #007bff;
        color: #fff;
        border: 1px solid #007bff;
        border-radius: 4px;
        cursor: pointer;
        text-align: center;
        text-decoration: none;
        margin-top: 10px; /* Adiciona um pequeno espaçamento */
    }
    span.button-like:hover {
        background-color: #0056b3;
        border-color: #0056b3;
    }
    #loadingOverlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
        font-size: 20px;
        display: none; /* Inicia oculto */
    }
`;
document.getElementsByTagName('head')[0].appendChild(styleSCT);

// --- Variáveis Globais ---
let alunoDados = []; // Usaremos um array para coletar os dados
let cabecalho = []; // Array para o cabeçalho (apenas para referência interna/debug)
let codigoAluno;    // Para armazenar o código do aluno atual

// --- Elementos do DOM ---
var divCorpo = document.createElement('div');
document.getElementsByTagName('body')[0].appendChild(divCorpo);

var ifrIframe1 = document.createElement("iframe");
ifrIframe1.setAttribute("id", "iframe1");
ifrIframe1.setAttribute("src", "about:blank");
ifrIframe1.setAttribute("style", "height: 500px; width: 800px; border: 1px solid red; position: fixed; top: 50px; left: 50px; z-index: 9998; display:none");
divCorpo.appendChild(ifrIframe1);

// Adiciona overlay de carregamento
var loadingOverlay = document.createElement('div');
loadingOverlay.id = 'loadingOverlay';
loadingOverlay.innerText = 'Carregando dados do aluno...';
document.body.appendChild(loadingOverlay);

// Remove o atributo 'action' do formulário principal para evitar navegação
// Isso garante que o clique em botões do Sigeduca não recarregue a página antes que o script termine.
if (parent.frames.document.getElementById('MAINFORM')) {
    parent.frames.document.getElementById('MAINFORM').removeAttribute("action");
}


// --- Funções Auxiliares ---

/**
 * Obtém o texto de um elemento pelo ID, tratando vazios e limpando a string.
 * @param {string} id - O ID do elemento HTML.
 * @param {boolean} cleanText - Se deve remover vírgulas, apóstrofos e aspas.
 * @param {string} defaultValue - Valor padrão se o elemento for "SELECIONE" ou vazio.
 * @param {Document} targetDocument - O objeto Document onde o elemento será procurado (pode ser parent.frames[0].document ou document).
 * @returns {string} O texto do elemento limpo ou uma string vazia.
 */
function getTextSafe(id, cleanText = true, defaultValue = '', targetDocument) {
    const element = targetDocument.getElementById(id);
    if (!element) {
        console.warn(`Elemento não encontrado: ${id} no documento ${targetDocument === document ? 'principal' : 'iframe'}`);
        return defaultValue;
    }
    let text = element.innerText.trim();

    if (text === 'SELECIONE' || text === '') {
        return defaultValue;
    }

    if (cleanText) {
        text = text.replace(/,/g, '').replace(/'/g, '`').replace(/"/g, '`');
    }
    return text;
}

/**
 * Formata um CPF para o padrão XXX.XXX.XXX-XX
 * @param {string} cpf - O CPF a ser formatado.
 * @returns {string} O CPF formatado ou vazio se inválido.
 */
function formatCPF(cpf) {
    if (!cpf) return '';
    cpf = cpf.replace(/\D/g, ''); // Remove não-dígitos
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

/**
 * Formata um telefone combinando DDD e número.
 * @param {string} dddId - O ID do elemento que contém o DDD.
 * @param {string} telId - O ID do elemento que contém o número de telefone.
 * @param {Document} targetDocument - O objeto Document onde os elementos serão procurados.
 * @returns {string} O telefone formatado como "(DDD) NUMERO" ou vazio.
 */
function formatPhone(dddId, telId, targetDocument) {
    const ddd = getTextSafe(dddId, true, '', targetDocument);
    const tel = getTextSafe(telId, true, '', targetDocument);
    if (ddd && tel) {
        return `(${ddd})${tel}`;
    } else if (tel) { // Se não tiver DDD separado, mas tiver o número
        return tel;
    }
    return '';
}

/**
 * Coleta os dados principais do aluno do primeiro frame.
 */
function coletaDados1() {
    console.log("Iniciando coletaDados1()...");
    ifrIframe1.removeEventListener("load", coletaDados1); // Remove listener para evitar duplicação

    alunoDados = []; // Reinicia o array de dados para cada nova coleta
    cabecalho = []; // Reinicia o cabeçalho (para debug)

    const iframeDoc = ifrIframe1.contentWindow.document;

    try {
        // *** Código do Aluno - ESSENCIAL ***
        codigoAluno = getTextSafe('span_vGERPESCODCHAR_0001', true, '', document);
        if (!codigoAluno) {
            alert('Não foi possível obter o Código do Aluno. Verifique se um aluno está selecionado na página principal.');
            hideLoading();
            return;
        }

        //Cod Aluno
        alunoDados.push(codigoAluno); cabecalho.push("Cod Aluno");

        // Demais campos, agora usando getTextSafe e passando iframeDoc como targetDocument
        alunoDados.push(getTextSafe('span_CTLGEDALUIDINEP', true, '', iframeDoc)); cabecalho.push("Nº INEP");
        alunoDados.push(getTextSafe('span_CTLGERPESNOM', true, '', iframeDoc)); cabecalho.push("Aluno");
        alunoDados.push(formatCPF(getTextSafe('span_CTLGERPESCPF', true, '', iframeDoc))); cabecalho.push("CPF do Aluno");
        alunoDados.push(getTextSafe('span_CTLGERPESRG', true, '', iframeDoc)); cabecalho.push("RG do aluno");
        alunoDados.push(getTextSafe('span_CTLGERORGEMICOD', true, '', iframeDoc)); cabecalho.push("Órgão Expedidor");
        alunoDados.push(getTextSafe('span_CTLGERPESUFEXP', true, '', iframeDoc)); cabecalho.push("UF Exp.");
        alunoDados.push(getTextSafe('span_CTLGERPESDTAEXP', true, '', iframeDoc)); cabecalho.push("Data Exp.");
        alunoDados.push(getTextSafe('span_CTLGERPESSEXO', true, '', iframeDoc)); cabecalho.push("Sexo do Aluno");
        alunoDados.push(getTextSafe('span_CTLGERPESDTANASC', true, '', iframeDoc)); cabecalho.push("Data de Nascimento");
        alunoDados.push(getTextSafe('span_CTLGERPESNATDSC', true, '', iframeDoc)); cabecalho.push("Naturalidade");
        alunoDados.push(getTextSafe('span_CTLGERPESNATUF', true, '', iframeDoc)); cabecalho.push("UF");
        alunoDados.push(getTextSafe('span_CTLGERPESNOMMAE', true, '', iframeDoc)); cabecalho.push("Filiação 1");
        alunoDados.push(getTextSafe('span_CTLGERPESNOMPAI', true, '', iframeDoc)); cabecalho.push("Filiação 2");

        // Contatos responsável 1
        alunoDados.push(getTextSafe('span_CTLGERPESNOMRESP', true, '', iframeDoc)); cabecalho.push("Nome do responsável 1");
        alunoDados.push(formatCPF(getTextSafe('span_CTLGERPESRESPCPF', true, '', iframeDoc))); cabecalho.push("CPF do responsável 1");
        alunoDados.push(formatPhone('span_CTLGERPESTELRESDDDRESP', 'span_CTLGERPESTELRESRESP', iframeDoc)); cabecalho.push("Tel Res Resp 1");
        alunoDados.push(formatPhone('span_CTLGERPESTELCELDDDRESP', 'span_CTLGERPESTELCELRESP', iframeDoc)); cabecalho.push("Tel Celular Resp 1");
        alunoDados.push(formatPhone('span_CTLGERPESTELCOMDDDRESP', 'span_CTLGERPESTELCOMRESP', iframeDoc)); cabecalho.push("Tel Comercial Resp 1");
        alunoDados.push(formatPhone('span_CTLGERPESTELCONDDDRESP', 'span_CTLGERPESTELCONRESP', iframeDoc)); cabecalho.push("Tel Contato Resp 1");
        alunoDados.push(getTextSafe('span_CTLGERPESEMAILRESP', true, '', iframeDoc)); cabecalho.push("E-mail Resp 1");

        // Contatos responsável 2
        alunoDados.push(getTextSafe('span_CTLGERPESNOMRESP2', true, '', iframeDoc)); cabecalho.push("Nome do responsável 2");
        alunoDados.push(formatCPF(getTextSafe('span_CTLGERPESRESPCPF2', true, '', iframeDoc))); cabecalho.push("CPF do responsável 2");
        alunoDados.push(formatPhone('span_CTLGERPESTELRESDDDRESP2', 'span_CTLGERPESTELRESRESP2', iframeDoc)); cabecalho.push("Tel Res Resp 2");
        alunoDados.push(formatPhone('span_CTLGERPESTELCELDDDRESP2', 'span_CTLGERPESTELCELRESP2', iframeDoc)); cabecalho.push("Tel Celular Resp 2");
        alunoDados.push(formatPhone('span_CTLGERPESTELCOMDDDRESP2', 'span_CTLGERPESTELCOMRESP2', iframeDoc)); cabecalho.push("Tel Comercial Resp 2");
        alunoDados.push(formatPhone('span_CTLGERPESTELCONDDDRESP2', 'span_CTLGERPESTELCONRESP2', iframeDoc)); cabecalho.push("Tel Contato Resp 2");
        alunoDados.push(getTextSafe('span_CTLGERPESEMAILRESP2', true, '', iframeDoc)); cabecalho.push("E-mail Resp 2");

        // Contato da seção final da página (ENDEREÇO) - Contato do Aluno
        alunoDados.push(formatPhone('span_CTLGERPESTELRESDDD', 'span_CTLGERPESTELRES', iframeDoc)); cabecalho.push("Tel Residencial Aluno");
        alunoDados.push(formatPhone('span_CTLGERPESTELCELDDD', 'span_CTLGERPESTELCEL', iframeDoc)); cabecalho.push("Tel Celular Aluno");
        alunoDados.push(formatPhone('span_CTLGERPESTELCOMDDD', 'span_CTLGERPESTELCOM', iframeDoc)); cabecalho.push("Tel Comercial Aluno");
        alunoDados.push(formatPhone('span_CTLGERPESTELCONDDD', 'span_CTLGERPESTELCON', iframeDoc)); cabecalho.push("Tel Contato Aluno");

        // Endereço
        alunoDados.push(getTextSafe('span_CTLGERPESEND', true, '', iframeDoc)); cabecalho.push("Endereço Rua");
        alunoDados.push(getTextSafe('span_CTLGERPESNMRLOG', true, '', iframeDoc)); cabecalho.push("Número");
        alunoDados.push(getTextSafe('span_CTLGERPESCMPLOG', true, '', iframeDoc)); cabecalho.push("Complemento");
        alunoDados.push(getTextSafe('span_CTLGERPESBAIRRO', true, '', iframeDoc)); cabecalho.push("Bairro");
        alunoDados.push(getTextSafe('span_CTLGERPESENDCIDDSC', true, '', iframeDoc)); cabecalho.push("Cidade");
        alunoDados.push(getTextSafe('span_CTLGERPESENDUF', true, '', iframeDoc)); cabecalho.push("UF Endereço");
        alunoDados.push(getTextSafe('span_CTLGERPESCEP', true, '', iframeDoc)); cabecalho.push("CEP");

        // Energia
        alunoDados.push(getTextSafe('span_CTLGERPESDISTCOD', true, '', iframeDoc)); cabecalho.push("Distribuidora Energia");
        alunoDados.push(getTextSafe('span_CTLGERPESUC', true, '', iframeDoc)); cabecalho.push("Unidade Consumidora");
        alunoDados.push(getTextSafe('span_CTLGERPESLOCRES', true, '', iframeDoc)); cabecalho.push("Endereço Urbano/Rural");
        alunoDados.push(getTextSafe('span_CTLGERPESNOMSOC', true, '', iframeDoc)); cabecalho.push("Nome Social");

        console.log("Dados principais coletados:", alunoDados);
        console.log("Cabeçalho interno para referência:", cabecalho);

    } catch (e) {
        console.error("Erro ao coletar dados principais:", e);
        alert("Ocorreu um erro ao coletar os dados principais do aluno. Verifique o console para mais detalhes.");
        hideLoading();
        return;
    }

    // Agora carrega o segundo frame (aba social) para pegar os dados adicionais
    // Remove listener anterior para evitar chamadas múltiplas
    ifrIframe1.removeEventListener("load", coletaDados2);
    ifrIframe1.addEventListener("load", coletaDados2);
    ifrIframe1.src = `http://sigeduca.seduc.mt.gov.br/ged/hwtmgedaluno1.aspx?${codigoAluno},,HWMConAluno,DSP,0,1,0,1`;
    console.log(`Carregando dados sociais para o aluno ${codigoAluno}...`);
}

/**
 * Coleta os dados sociais do aluno do segundo frame.
 */
function coletaDados2() {
    console.log("Iniciando coletaDados2()...");
    ifrIframe1.removeEventListener("load", coletaDados2); // Remove listener

    const iframeDoc = ifrIframe1.contentWindow.document;

    try {
        alunoDados.push(getTextSafe('span_CTLGERPESNUMCARTAOSUS', true, '', iframeDoc)); cabecalho.push("Nro SUS");
        alunoDados.push(getTextSafe('span_CTLGERPESNIS', true, '', iframeDoc)); cabecalho.push("Nro NIS");
        alunoDados.push(getTextSafe('span_CTLGEDALUTIPOSANGUINEO', true, 'não consta', iframeDoc)); cabecalho.push("Tipo sanguíneo");
        alunoDados.push(getTextSafe('span_CTLGEDALURECATEEDUESP', true, '', iframeDoc)); cabecalho.push("Recebe Atendimento Especializado");
        alunoDados.push(getTextSafe('span_CTLGERPESBENPCAS', true, '', iframeDoc)); cabecalho.push("Recebe BPC");
        alunoDados.push(getTextSafe('span_CTLGEDALUPASSELIVRE', true, '', iframeDoc)); cabecalho.push("Utiliza Passe Livre");
        alunoDados.push(getTextSafe('span_CTLGEDALUINFADICIONAIS', true, '', iframeDoc)); cabecalho.push("Informações Adicionais");

        // Necessidades Nutricionais (lógica mais complexa de checkboxes)
        alunoDados.push(getNecessidadesNutricionais(iframeDoc)); cabecalho.push("Necessidades Nutricionais");

        console.log("Dados sociais coletados:", alunoDados);
        console.log("Cabeçalho final (para depuração):", cabecalho);
        console.log("Array completo de dados do aluno:", alunoDados);


        // *** Alteração chave: A string de dados para envio NÃO inclui o cabeçalho ***
        const csvContent = alunoDados.join(';'); // Apenas os dados do aluno, separados por ponto e vírgula.

        console.log("Dados que serão enviados (CSV formatado, SEM CABEÇALHO):", csvContent);

        // Envia os dados combinados
        submit_post_via_hidden_form('https://open4school.com.br/open/secretaria/importa_sigeduca.php', csvContent);

    } catch (e) {
        console.error("Erro ao coletar dados sociais:", e);
        alert("Ocorreu um erro ao coletar os dados sociais do aluno. Verifique o console para mais detalhes.");
    } finally {
        hideLoading();
    }
}

/**
 * Coleta as necessidades nutricionais a partir dos checkboxes no iframe.
 * @param {Document} iframeDoc - O objeto Document do iframe.
 * @returns {string} Uma string com as necessidades nutricionais separadas por '; '.
 */
function getNecessidadesNutricionais(iframeDoc) {
    const mapeamentoNecessidades = {
        'vSELECAONECNUT_0001': 'Não Declarado',
        'vSELECAONECNUT_0002': 'Diabetes',
        'vSELECAONECNUT_0003': 'Hipertensão',
        'vSELECAONECNUT_0004': 'Anemias',
        'vSELECAONECNUT_0005': 'Alergias',
        'vSELECAONECNUT_0006': 'Intolerâncias Alimentares',
        'vSELECAONECNUT_0007': 'Doença Celíaca',
        'vSELECAONECNUT_0008': 'Outras'
    };

    const naoDeclarado = iframeDoc.querySelector('input[name="vSELECAONECNUT_0001"]');
    if (naoDeclarado && naoDeclarado.value === "1") {
        return "Não Declarado";
    }

    let necessidadesEncontradas = [];
    for (let i = 2; i <= 8; i++) {
        const codigo = 'vSELECAONECNUT_' + ('000' + i).slice(-4);
        const checkbox = iframeDoc.querySelector(`input[name="${codigo}"]`);
        if (checkbox && checkbox.value === "1") {
            necessidadesEncontradas.push(mapeamentoNecessidades[codigo]);
        }
    }
    return necessidadesEncontradas.join(' - ');
}


/**
 * Envia os dados para a URL especificada via POST em um formulário oculto.
 * @param {string} url - A URL de destino.
 * @param {string} params - Os dados a serem enviados (já formatados como string CSV).
 */
function submit_post_via_hidden_form(url, params) {
    console.log("Enviando dados via POST para:", url);
    var f = $("<form target='_blank' method='POST' style='display:none;'></form>").attr({
        action: url
    }).appendTo(document.body);

    // Adiciona BOM (Byte Order Mark) para garantir que caracteres especiais
    // sejam exibidos corretamente no lado do servidor, se a codificação for UTF-8.
    const BOM = "\uFEFF";
    const finalParams = BOM + params;

    $('<input type="hidden" />').attr({
        value: finalParams,
        name: 'data'
    }).appendTo(f);

    f.submit();
    f.remove();
    alert('Dados enviados com sucesso para o Open4School!');
}

/**
 * Exibe a overlay de carregamento.
 */
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

/**
 * Oculta a overlay de carregamento.
 */
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

/**
 * Adiciona o botão "Encaminhar dados para Open" na página.
 */
function addCopyBtn() {
    var botao = document.createElement("span");
    botao.innerHTML = "Encaminhar dados para Open";
    botao.className = "button-like";
    botao.onclick = () => {
        // Verifica se o campo de código do aluno principal existe na página atual (fora do iframe)
        const alunoCodeElement = document.getElementById('span_vGERPESCODCHAR_0001');
        if (alunoCodeElement && alunoCodeElement.innerText.trim() !== '') {
            showLoading();
            // Inicia o carregamento do iframe para coletar os dados.
            // O listener 'load' no iframe chamará 'coletaDados1'
            ifrIframe1.removeEventListener("load", coletaDados1); // Garante que não há listeners antigos
            ifrIframe1.addEventListener("load", coletaDados1);
            // O link inicial para o iframe que contém os dados principais do aluno
            ifrIframe1.src = `http://sigeduca.seduc.mt.gov.br/ged/hwtmgedaluno.aspx?${alunoCodeElement.innerText.trim()},,HWMConAluno,DSP,1,0`;
            console.log(`Iniciando coleta para o aluno com o código da página principal: ${alunoCodeElement.innerText.trim()}`);
        } else {
            alert('Por favor, pesquise e selecione um aluno pelo código antes de clicar em enviar.');
            console.warn("Elemento 'span_vGERPESCODCHAR_0001' não encontrado ou vazio na página principal.");
        }
    };
    var tabela = document.getElementById("TABLE4");
    if (tabela) {
        tabela.parentNode.insertBefore(botao, tabela.nextSibling);
    } else {
        console.error("Elemento 'TABLE4' não encontrado para inserir o botão. Inserindo no corpo do documento como fallback.");
        // Fallback: tenta adicionar no corpo se TABLE4 não for encontrado
        document.body.appendChild(botao);
    }
}

// --- Inicialização ---
(function() {
    'use strict';
    addCopyBtn();
})();
