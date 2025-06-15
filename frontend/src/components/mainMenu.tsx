import React from "react";
import { BrMenu, BrHeader } from "@govbr-ds/react-components";

const MainMenu = () => {
  return (
    <>
      <BrMenu
        data={[
          {
            divider: true,
            icon: "home",
            label: "Página Inicial",
            onClick: function Dc() {},
          },
          {
            icon: "calendar",
            label: "Folder",
            submenu: [
              {
                icon: "moon",
                label: "Sub Folder 1",
                onClick: function Dc() {},
              },
              {
                icon: "sun",
                label: "Sub Folder 2",
                submenu: [
                  {
                    icon: "wifi",
                    label: "Sub Sub Folder 1",
                    onClick: function Dc() {},
                  },
                ],
              },
            ],
          },
        ]}
        externalLinks={[
          {
            label: "Link externo 01",
            link: "https://google.com/",
          },
          {
            label: "Link externo 02",
            link: "https://google.com/",
          },
        ]}
        id="main-navigation"
        info={
          <div className="text-center text-down-01">
            Todo o conteúdo deste site está publicado sob a licença{" "}
            <strong>Creative Commons Atribuição-SemDerivações 3.0</strong>
          </div>
        }
        logos={[
          {
            alt: "Logo 01",
            src: "https://www.gov.br/ds/assets/img/govbr-logo.png",
          },
          {
            alt: "Logo 02",
            src: "https://www.gov.br/ds/assets/img/govbr-logo.png",
          },
        ]}
        socialNetworks={[
          {
            icon: "fab fa-facebook-f",
            link: "#",
            name: "Facebook",
          },
          {
            icon: "fab fa-twitter",
            link: "#",
            name: "Twitter",
          },
          {
            icon: "fab fa-linkedin-in",
            link: "#",
            name: "Linkedin",
          },
          {
            icon: "fab fa-whatsapp",
            link: "#",
            name: "Whatsapp",
          },
        ]}
        systemLogoUrl="https://www.gov.br/ds/assets/img/govbr-logo.png"
        systemName="Compras Executivo"
      />

      <BrHeader
        features={[
          {
            icon: "chart-bar",
            label: "Funcionalidade 1",
            onClick: function Dc() {},
          },
          {
            icon: "headset",
            label: "Funcionalidade 2",
            onClick: function Dc() {},
          },
          {
            icon: "comment",
            label: "Funcionalidade 3",
            onClick: function Dc() {},
          },
          {
            icon: "adjust",
            label: "Funcionalidade 4",
            onClick: function Dc() {},
          },
        ]}
        fluid="xl"
        menuId="main-navigation"
        onClickLogin={function Dc() {}}
        onSearch={function Dc() {}}
        quickAccessLinks={[
          {
            label: "Acesso Rápido 1",
            onClick: function Dc() {},
          },
          {
            label: "Acesso Rápido 2",
            onClick: function Dc() {},
          },
        ]}
        showMenuButton
        showSearchBar
        signature="Compras Executivo"
        subTitle="Design System | Versão 3.6.1"
        title="Compras Executivo"
        urlLogo="https://www.gov.br/ds/assets/img/govbr-logo.png"
      />
    </>
  );
};

export default MainMenu;
