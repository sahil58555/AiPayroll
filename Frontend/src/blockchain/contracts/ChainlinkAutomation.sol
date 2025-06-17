// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BulkPayout {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    // Employee struct with address and salary
    struct Employee {
        address payable account;
        uint256 salary;
    }

    // Array to store employee data
    Employee[] public employees;

    // Function to deposit funds to the contract
    function deposit() external payable onlyOwner {}

    // Function to add an employee to the list
    function addEmployee(address payable _account, uint256 _salary) external onlyOwner {
        employees.push(Employee(_account, _salary));
    }

    // Function to send salaries to all stored employees
    function sendSalaries() external onlyOwner {
        for (uint256 i = 0; i < employees.length; i++) {
            Employee memory emp = employees[i];
            require(address(this).balance >= emp.salary, "Insufficient contract balance");
            emp.account.transfer(emp.salary);
        }
    }

    // View function to get contract balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // View function to get number of employees
    function getEmployeeCount() external view returns (uint256) {
        return employees.length;
    }

    // Optional: Clear employee list after payout (if needed)
    function clearEmployees() external onlyOwner {
        delete employees;
    }
}
