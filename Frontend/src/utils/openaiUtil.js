import { verifyToken } from "./jwt";
import { executeBulkTransfer } from "../blockchain/scripts/Token";
import { ethers } from "ethers";
import axios from "axios";
import { backendDomain } from "../constant/domain";

export const payEmployees = async (signer) => {
  const token = localStorage.getItem("token");
  console.log("token:", token);

  const data = verifyToken(token);
  console.log("Data", data);
  const contractAddress = data.contractAddress;
  const employees = await getEmployeeInfo();
  console.log("Employees:", employees);
  const recipients = employees.map((employee) => employee.accountId);

  const values = employees.map((employee) =>
    ethers.parseEther(employee.salary.$numberDecimal)
  );

  const totalAmount = values.reduce((acc, value) => acc + value, 0n);
  const receipt = await executeBulkTransfer(
    signer,
    contractAddress,
    recipients,
    values,
    totalAmount
  );
  console.log("Transaction receipt:", receipt);
  const payrollData = employees.map((employee) => ({
    email: employee.email,
    amount: employee.salary.$numberDecimal,
    accountId: employee.accountId,
    company: data.company,
  }));

  const response = await axios.post(
    `${backendDomain}/payroll/pending`,
    {
      payrollDataArray: payrollData,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const ids = response.data.data.map((obj) => obj._id);

  await axios.post(
    `${backendDomain}/payroll/processed`,
    {
      payrollIds: ids,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

const getEmployeeInfo = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${backendDomain}/admin/get-all-empolyees`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.employee;
};
