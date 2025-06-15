// ContractTable.tsx
import React, { useEffect, useState } from "react";

type Contract = {
  numero: string;
  equipe: string;
  vigencia: string;
  renovacao: string;
  contratado: string;
  empenhado: string;
  pagamentos: string;
};

type Props = {
  selectedYear: string | null;
};

const generateFakeContracts = (count: number): Contract[] => {
  const contratos: Contract[] = [];

  for (let i = 0; i < count; i++) {
    const year = 2021 + (i % 4);
    contratos.push({
      numero: `${1000 + i}/${year}`,
      equipe: `Equipe ${String.fromCharCode(65 + (i % 10))}`,
      vigencia: `01/01/${year} - 31/12/${year + 3}`,
      renovacao: `${1 + (i % 3)}ª renovação`,
      contratado: `Empresa ${String.fromCharCode(65 + (i % 26))}`,
      empenhado: `R$ ${(Math.random() * 1000000).toFixed(2)}`,
      pagamentos: `R$ ${(Math.random() * 1000000).toFixed(2)}`,
    });
  }

  return contratos;
};

const ContractTable: React.FC<Props> = ({ selectedYear }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    const data = generateFakeContracts(30);
    setContracts(data);
  }, []);

  const filtered = selectedYear
    ? contracts.filter((c) => c.numero.includes(`/${selectedYear}`))
    : contracts;

  return (
    <div className="table-responsive">
      <table className="br-table table-hover table-striped">
        <thead>
          <tr>
            <th>Detalhes do contrato</th>
            <th className="hide-mobile">Equipe</th>
            <th className="hide-mobile">Vigência</th>
            <th className="hide-mobile">Renovação</th>
            <th className="hide-mobile">Contratado</th>
            <th className="hide-mobile">Empenhado</th>
            <th className="hide-mobile">Pagamentos</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c, idx) => (
            <tr key={idx}>
              <td>{c.numero}</td>
              <td className="hide-mobile">{c.equipe}</td>
              <td className="hide-mobile">{c.vigencia}</td>
              <td className="hide-mobile">{c.renovacao}</td>
              <td className="hide-mobile">{c.contratado}</td>
              <td className="hide-mobile">{c.empenhado}</td>
              <td className="hide-mobile">{c.pagamentos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContractTable;
