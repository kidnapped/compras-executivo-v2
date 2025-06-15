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

const ContractTable: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/contratos", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setContracts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch contracts:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="table-responsive">
      <table className="br-table table-hover table-striped">
        <thead>
          <tr>
            <th>Detalhes do contrato</th>
            <th className="hide-mobile">Equipe de Fiscalização</th>
            <th className="hide-mobile">Vigência</th>
            <th className="hide-mobile">Renovação</th>
            <th className="hide-mobile">Contratado</th>
            <th className="hide-mobile">Empenhado</th>
            <th className="hide-mobile">Pagamentos</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract, index) => (
            <tr key={index}>
              <td>{contract.numero}</td>
              <td className="hide-mobile">{contract.equipe}</td>
              <td className="hide-mobile">{contract.vigencia}</td>
              <td className="hide-mobile">{contract.renovacao}</td>
              <td className="hide-mobile">{contract.contratado}</td>
              <td className="hide-mobile">{contract.empenhado}</td>
              <td className="hide-mobile">{contract.pagamentos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContractTable;
