export default {
  cardHeader({ titulo, subtitulo, icone = "/static/images/doc2.png" }) {
    return `
            <div class="card-header">
                <div class="d-flex" style="width: 100%;">
                    <div class="ml-3" style="flex-grow: 1;">
                        <div class="titulo">
                            <img src="${icone}" alt="Ícone" style="height: 36px;margin:10px 0px -10px 0px;">
                            ${titulo}
                        </div>
                        <div style="border-bottom: 1px solid #ccc;margin:-6px 0px 0px 26px;"></div>
                        <div class="subtitulo">${subtitulo}</div>
                    </div>
                    <div class="ml-auto" style="margin: -10px -10px 0px 0px;">
                        <button class="br-button circle" type="button" aria-label="Mais opções">
                            <i class="fas fa-ellipsis-v" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
  },
};
