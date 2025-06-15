import "./App.css";
import {
  BrButton,
  BrMenu,
  BrHeader,
  BrFooter,
  BrCard,
  Container,
  Row,
  Col,
} from "@govbr-ds/react-components";
import MyChart from "./components/chart";
import contratos from "./components/ContractTable";
// App.tsx
import { useState } from "react";
import MainMenu from "./components/mainMenu";
import ApiTest from "./components/apitest";
import DashboardCard from "./components/testApiTest";
import ContractTable from "./components/ContractTable";
import ApiChart from "./components/apitest";

function App() {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const handleYearClick = (year: string) => {
    console.log("Year selected:", year);
    setSelectedYear(year);
  };
  return (
    <>
      <MainMenu />
      <Login />
      <ApiChart className="--test" />
      <Row justifyContent="between" alignItems="start" rowCols={4} flex>
        <DashboardCard
          title="Contratos por exercício"
          subtitle="Histórico de contratos por ano"
          iconClass="fas fa-book"
          anos={["2019", "2020", "2021", "2022", "2023", "2024", "2025"]}
          valores={[5, 3, 4, 2, 3, 4, 5]}
          onYearClick={handleYearClick}
        />
        <DashboardCard
          title="Contratos por exercício"
          subtitle="Histórico de contratos por ano"
          iconClass="fas fa-book"
          anos={["2019", "2020", "2021", "2022", "2023", "2024", "2025"]}
          valores={[5, 3, 4, 2, 3, 4, 5]}
          onYearClick={handleYearClick}
        />
        <DashboardCard
          title="Contratos por exercício"
          subtitle="Histórico de contratos por ano"
          iconClass="fas fa-book"
          anos={["2019", "2020", "2021", "2022", "2023", "2024", "2025"]}
          valores={[5, 3, 4, 2, 3, 4, 5]}
          onYearClick={handleYearClick}
        />

        <DashboardCard
          title="Contratos por exercício"
          subtitle="Histórico de contratos por ano"
          iconClass="fas fa-book"
          anos={["2019", "2020", "2021", "2022", "2023", "2024", "2025"]}
          valores={[5, 3, 4, 2, 3, 4, 5]}
          onYearClick={handleYearClick}
        />
      </Row>
      <Row className="w-100">
        <ContractTable selectedYear={selectedYear}></ContractTable>
      </Row>
      <BrFooter
        footerImages={[
          {
            link: "#",
            name: "Footer Image 1",
            url: "https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/images/logo-assign-negative.png",
          },
          {
            link: "#",
            name: "Footer Image 2",
            url: "https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/images/logo-assign-negative.png",
          },
        ]}
        links={[
          {
            category: "Categoria 1",
            items: [
              {
                label: "Ad deserunt nostrud",
                link: "#",
              },
              {
                label: "Nulla occaecat eiusmod",
                link: "#",
              },
              {
                label: "Nulla occaecat eiusmod",
                link: "#",
              },
            ],
          },
          {
            category: "Categoria 2",
            items: [
              {
                label: "Ex qui laborum consectetur aute commodo",
                link: "#",
              },
              {
                label: "Nulla occaecat eiusmod",
                link: "#",
              },
              {
                label: "Ex qui laborum consectetur aute commodo",
                link: "#",
              },
            ],
          },
          {
            category: "Categoria 3",
            items: [
              {
                label: "Ad deserunt nostrud",
                link: "#",
              },
              {
                label: "Ex qui laborum consectetur aute commodo",
                link: "#",
              },
              {
                label: "Nulla occaecat eiusmod",
                link: "#",
              },
            ],
          },
          {
            category: "Categoria 4",
            items: [
              {
                label: "Ad deserunt nostrud",
                link: "#",
              },
              {
                label: "Ex qui laborum consectetur aute commodo",
                link: "#",
              },
              {
                label: "Nulla occaecat eiusmod",
                link: "#",
              },
            ],
          },
          {
            category: "Categoria 5",
            items: [
              {
                label: "Ex qui laborum consectetur aute commodo",
                link: "#",
              },
              {
                label: "Nulla occaecat eiusmod",
                link: "#",
              },
              {
                label: "Nulla occaecat eiusmod",
                link: "#",
              },
            ],
          },
          {
            category: "Categoria 6",
            items: [
              {
                label: "Ex qui laborum consectetur aute commodo",
                link: "#",
              },
              {
                label: "Nulla occaecat eiusmod",
                link: "#",
              },
              {
                label: "Nulla occaecat eiusmod",
                link: "#",
              },
            ],
          },
        ]}
        socialNetworks={[
          {
            icon: "fab fa-facebook-square",
            link: "#",
            name: "Facebook",
          },
          {
            icon: "fab fa-twitter-square",
            link: "#",
            name: "Twitter",
          },
          {
            icon: "fab fa-linkedin",
            link: "#",
            name: "Linkedin",
          },
        ]}
        urlLogo="https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/images/logo-negative.png"
        userLicenseText={
          <>
            Texto destinado a exibição de informações relacionadas à 
            <b>licença de uso.</b>
          </>
        }
      />
    </>
  );
}

function Login() {
  return <div>login</div>;
}

export default App;
