const Company = require("../models/companySchema");
const Employee = require("../models/employeeSchema");

const addEmployee = async (req, args) => {
  try {
    const company = await Company.findOne({ email: req.user.email });

    const employee = await Employee.create({
      ...args,
      password: "12345678", //TODO
      company: company._id,
    });
    company.employees.push(employee._id);
    await company.save();

    return { message: "Employee added" };
  } catch (err) {
    return { error: err.message };
  }
};

const deleteEmployee = async (req, args) => {
  try {
    const employee = await Employee.findByIdAndDelete(args.id);

    await Company.findByIdAndUpdate(
      employee.company,
      { $pull: { employees: employee._id } },
      { new: true }
    );

    return { message: "Employee deleted and company updated successfully" };
  } catch (err) {
    return { error: err.message };
  }
};

const totalSalary = async (req, args) => {
  try {
    const company = await Company.findOne({ email: req.user.email }).populate(
      "employees"
    );

    if (!company) {
      throw new Error("Company not found");
    }

    const totalSalary = company.employees.reduce((sum, employee) => {
      return sum + parseFloat(employee.salary.toString());
    }, 0);

    return { message: totalSalary };
  } catch (err) {
    return { error: err.message };
  }
};

const employeesByEmail = async (req, args) => {
  try {
    // Find the company by email and populate the employees array
    const company = await Company.findOne({ email: req.user.email }).populate(
      "employees"
    );

    if (!company) {
      return { message: "Company not found" };
    }

    return { message: company.employees };
  } catch (err) {
    return { error: err.message };
  }
};

module.exports = {
  addEmployee,
  deleteEmployee,
  totalSalary,
  employeesByEmail,
};
