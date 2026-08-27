import * as customerService from '../services/customer.service.js';

export const getCustomers = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const result = await customerService.listCustomers(req.branchId, search, page, limit);
    res.json({
      success: true,
      branchId: req.branchId,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const searchCustomers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const customers = await customerService.searchCustomersForPos(req.branchId, q);
    res.json({
      success: true,
      branchId: req.branchId,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

export const saveCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.saveCustomer(req.branchId, req.body);
    res.status(201).json({
      success: true,
      branchId: req.branchId,
      data: customer,
      message: 'Customer saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerDetails = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerDetails(req.branchId, req.params.id);
    res.json({
      success: true,
      branchId: req.branchId,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};
