import {
  listSuppliers as listSuppliersService,
  createSupplier as createSupplierService,
} from '../services/supplier.service.js';

export const listSuppliers = async (req, res, next) => {
  try {
    const suppliers = await listSuppliersService(req.branchId, req.query?.search);
    res.status(200).json({
      success: true,
      branchId: req.branchId,
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const supplier = await createSupplierService(req.branchId, req.body);
    res.status(201).json({
      success: true,
      message: `Supplier ${supplier.name} created successfully`,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};
