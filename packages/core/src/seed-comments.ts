import type { Role } from './types';

/**
 * Fictional comment bank for the demo seed. Every sentence is written to read like a real
 * customer of the invented product "Atlas Analytics" and to hit the theme dictionary in
 * `themes.ts` (performance, usability, support, price, integrations, reports).
 */

export const POSITIVE_COMMENTS = [
  'A interface é intuitiva: meu time aprendeu a usar em uma tarde, sem treinamento.',
  'O suporte respondeu meu chamado em menos de uma hora e resolveu de verdade. Atendimento excelente.',
  'Os dashboards com filtro por segmento economizam horas de análise toda semana.',
  'A integração com o Slack mantém o time inteiro atualizado sem ninguém abrir a ferramenta.',
  'Carregamento rápido mesmo com dezenas de milhares de respostas na mesma pesquisa.',
  'Exportar o relatório para a diretoria ficou fácil: um clique e já sai com os gráficos.',
  'Passamos de três planilhas para um só lugar. A comparação entre segmentos mudou nossas reuniões.',
  'O preço é justo para o que entrega, principalmente depois que ativamos os alertas automáticos.',
  'A navegação é clara, nunca me perco entre pesquisa, respostas e relatórios.',
  'A API é bem documentada e levamos um dia para ligar tudo ao nosso data warehouse.',
  'Gosto de ver o NPS evoluindo semana a semana no gráfico; virou ritual do time de produto.',
  'O time de suporte conhece o produto de verdade e já sugeriu filtros que não conhecíamos.',
  'Consigo abrir uma fala de cliente direto do relatório. Isso dá credibilidade às nossas decisões.',
  'Painel leve e rápido, funciona até no celular quando estou em reunião fora do escritório.',
  'A integração com webhook foi simples e nos permitiu abrir tarefas automaticamente a partir de detratores.',
  'Interface limpa, sem excesso de botões. Dá vontade de abrir todos os dias.',
  'O custo por usuário compensou: reduzimos o tempo de preparo do relatório mensal de dois dias para duas horas.',
  'Os filtros salvos e o dashboard por região ajudaram a convencer a diretoria a investir no Nordeste.',
  'Atendimento humano e rápido. Resolveram minha dúvida sobre exportar dados por chamado, no mesmo dia.',
  'A leitura das falas ficou prazerosa; agrupar por tema poupa a leitura de centenas de comentários.',
  'Fácil de configurar e de compartilhar com quem não é da área de pesquisa.',
  'O gráfico de evolução deixou claro o efeito da nossa mudança de onboarding. Recomendo sem medo.',
  'Nunca tive lentidão, nem em dias de campanha com muitas respostas entrando.',
  'A possibilidade de comparar segmento com segmento sem montar planilha é o grande diferencial.',
  'Excelente custo-benefício; o plano Pro cobre tudo o que precisamos hoje.',
  'A equipe de suporte acompanhou nossa implantação e o resultado foi muito acima do esperado.',
  'Integração com a nossa API de CRM funcionou de primeira, com poucos ajustes.',
  'O relatório por plano mostrou onde estávamos perdendo clientes. Valeu cada centavo da licença.',
  'Interface moderna e acessível, até quem enxerga mal consegue usar com o teclado.',
  'Tudo carrega rápido e os filtros respondem na hora. Isso faz diferença em reunião ao vivo.',
] as const;

export const NEUTRAL_COMMENTS = [
  'Atende bem, mas o preço do plano pesa no orçamento de uma equipe pequena como a nossa.',
  'Funciona, porém a navegação entre pesquisas poderia ser mais clara para quem tem muitas.',
  'Gosto dos gráficos, mas sinto falta de exportar em mais formatos além de CSV.',
  'Bom produto; a API poderia ter mais exemplos e um guia de início rápido.',
  'O suporte é educado, mas às vezes a resposta do time chega só no dia seguinte.',
  'A interface é boa, porém alguns filtros ficam escondidos e levei um tempo para achá-los.',
  'Os relatórios são bons, mas faltam modelos prontos para diretoria e para clientes.',
  'O dashboard abre rápido, só fica um pouco pesado quando junto muitas pesquisas.',
  'Integração com Slack funciona, mas gostaria de escolher o canal por tema.',
  'Preço razoável, mas o salto do plano Free para o Pro é grande para o que preciso.',
  'Usamos pouco: o essencial está lá, mas ainda não encontramos motivo para ampliar a licença.',
  'Bom para pesquisas simples. Para análises mais profundas ainda exportamos tudo para outra ferramenta.',
  'O atendimento resolve, mas o primeiro chamado demorou mais do que eu esperava.',
  'A curva de aprendizado é suave no começo, mas os relatórios avançados exigem leitura da documentação.',
  'O filtro por segmento é ótimo; seria melhor poder salvar combinações para reutilizar.',
  'Tem tudo que preciso, só o custo extra por usuário adicional complica o crescimento do time.',
  'Gosto da proposta, mas o carregamento do gráfico de evolução às vezes demora alguns segundos.',
  'Boa ferramenta. A integração com webhook poderia avisar quando falha, hoje descubro por acaso.',
  'A navegação é intuitiva em geral, só o menu de pesquisas encerradas confunde um pouco.',
  'Estou satisfeito, mas gostaria de relatórios agendados por e-mail toda segunda-feira.',
  'A síntese ajuda, mas queria que o texto indicasse melhor o tamanho da amostra de cada tema.',
  'Suporte bom, documentação razoável. Sinto falta de exemplos de integração com ferramentas de BI.',
] as const;

export const NEGATIVE_COMMENTS = [
  'O dashboard fica lento quando aplico muitos filtros e às vezes trava no meio da reunião.',
  'Achei a interface confusa e difícil para quem está começando: gastei uma semana para entender os filtros.',
  'O suporte demora dias para responder um chamado simples. Já perdi prazo de entrega por causa disso.',
  'Caro demais para o que entrega: pagamos licença por usuário e a maioria só olha o dashboard.',
  'Falta integração com as ferramentas que usamos e a API é limitada. Acabo exportando tudo na mão.',
  'Os relatórios não deixam comparar segmento com segmento, preciso montar planilha todo mês.',
  'Quando carrego pesquisas com muitas respostas, o gráfico demora tanto que desisto e abro no Excel.',
  'Abri um chamado há duas semanas e a resposta do time foi um texto genérico que não resolveu nada.',
  'O reajuste de preço veio sem aviso e sem melhoria visível. Estamos avaliando alternativas.',
  'Difícil encontrar onde exportar os dados. A navegação esconde as opções mais usadas.',
  'A integração com o Slack caiu três vezes no trimestre e ninguém nos avisou.',
  'O relatório de segmentos mistura períodos e confunde a leitura dos gráficos.',
  'Tentei usar a API e a documentação está desatualizada: metade dos endpoints não existe mais.',
  'Interface cheia de menus; para criar um filtro simples preciso de seis cliques.',
  'O carregamento do painel é lento no celular, praticamente inutilizável fora do escritório.',
  'Pago caro e ainda preciso de plano superior para liberar exportação. Faltou transparência.',
  'O atendimento é frio: respondem com links da central de ajuda sem ler o que eu escrevi no chamado.',
  'Os filtros resetam sozinhos quando troco de aba, perco o contexto toda hora.',
  'Falta webhook para avisar quando chega uma nota baixa. Hoje descobrimos o detrator dias depois.',
  'A comparação por região trava com muitos dados e o dashboard congela por alguns segundos.',
  'Nossa licença venceu e a renovação custou o dobro. Difícil justificar o custo para a diretoria.',
  'O suporte não tem horário comercial claro e o chamado ficou sem dono por uma semana.',
  'A interface mudou sem aviso e meu time ficou perdido; o menu antigo era muito mais fácil.',
  'O gráfico de evolução não mostra o tamanho da amostra, então não sei quando confiar no número.',
  'O custo cresce rápido com cada usuário novo, e o plano mais barato limita demais os relatórios.',
  'Exportar relatório gera um arquivo bagunçado, sem os gráficos, e preciso reformatar tudo.',
  'Ficou lento depois da última atualização. A tela de respostas leva uns dez segundos para abrir.',
  'Procurei integração com nosso CRM e a API só atende a casos básicos. Faltam exemplos.',
  'Muita coisa para clicar e pouca explicação. A navegação é um labirinto para quem é novo.',
  'Atendimento por chamado é lento e o time de suporte pede as mesmas informações duas vezes.',
] as const;

export const ROLE_PREFIX: Record<Role, readonly string[]> = {
  produto: ['Como PM, ', 'Do lado de produto: ', 'Para quem decide roadmap, '],
  engenharia: ['Pelo lado técnico: ', 'Como engenheiro, ', 'Olhando a parte de dados: '],
  design: ['Como designer, ', 'Falando de experiência de uso: ', 'Pela ótica de design: '],
  pesquisa: ['Como pesquisadora, ', 'Para quem conduz pesquisa todo dia: ', 'Na minha rotina de pesquisa: '],
  marketing: ['Do lado de marketing: ', 'Como analista de marketing, ', 'Para campanhas, '],
};

export const TAILS_POSITIVE = [
  ' Obrigado por perguntar.',
  ' Digo isso depois de seis meses de uso.',
  ' Recomendo sem medo.',
  ' Falo pela equipe toda, não só por mim.',
] as const;

export const TAILS_CRITICAL = [
  ' Obrigado por perguntar.',
  ' Se melhorarem isso, a nota sobe.',
  ' Digo isso depois de seis meses de uso.',
  ' Falo pela equipe toda, não só por mim.',
  ' Fica a sugestão.',
] as const;
