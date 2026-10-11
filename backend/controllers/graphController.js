const graphSyncService = require('../services/graphSyncService');

/**
 * Admin-only: Trigger full graph projection synchronization.
 * POST /api/graph/sync
 */
exports.sync = async (req, res, next) => {
  try {
    const result = await graphSyncService.syncGraph();
    res.json({
      success: true,
      message: 'Neo4j graph projection replaced successfully from MySQL.',
      lastSyncTime: result.lastSyncTime,
      nodeCounts: result.nodeCounts,
      relationshipCounts: result.relationshipCounts
    });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    if (error.statusCode === 503) {
      return res.status(503).json({
        success: false,
        message: error.message
      });
    }
    console.error('Graph synchronization error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to synchronize graph projection.'
    });
  }
};

/**
 * Authenticated: Get Neo4j graph projection status and health.
 * GET /api/graph/status
 */
exports.getStatus = async (req, res, next) => {
  try {
    const status = await graphSyncService.getGraphStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve graph status.'
    });
  }
};

/**
 * Strips PII fields (email, phone) from the donor sub-object
 * for non-Admin roles. Admin receives the full object.
 * Doctor and Nurse match the same field policy as donorRoutes.js
 * (read access to donor records, but contact PII is Admin-restricted
 * in the trace context where it is surfaced alongside graph data).
 */
function applyDonorPiiPolicy(donorObj, role) {
  if (!donorObj) return donorObj;
  if (role === 'Admin') return donorObj;
  // Doctor and Nurse: omit contact PII; blood_group and name are retained
  // as they are medically relevant and already visible through donorRoutes.
  const { email, phone, ...safe } = donorObj; // eslint-disable-line no-unused-vars
  return safe;
}

/**
 * Admin, Doctor, Nurse: Get donor-to-donation-to-blood-unit trace for a specific BloodUnit.
 * GET /api/graph/trace/unit/:id
 */
exports.traceUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = req.user && req.user.role;
    const trace = await graphSyncService.traceByUnitId(id);
    // Apply PII policy to embedded donor object
    const sanitised = {
      ...trace,
      donor: applyDonorPiiPolicy(trace.donor, role)
    };
    res.json({
      success: true,
      data: sanitised
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    console.error('Trace unit error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to trace blood unit.'
    });
  }
};

/**
 * Admin, Doctor, Nurse: Get donation traceability for a specific Donor.
 * Zero donations return valid empty trace.
 * GET /api/graph/trace/donor/:id
 */
exports.traceDonor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = req.user && req.user.role;
    const trace = await graphSyncService.traceByDonorId(id);
    // Apply PII policy to top-level donor object
    const sanitised = {
      ...trace,
      donor: applyDonorPiiPolicy(trace.donor, role)
    };
    res.json({
      success: true,
      data: sanitised
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    console.error('Trace donor error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to trace donor.'
    });
  }
};
