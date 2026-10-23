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

function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***.***';
  const [user, domain] = email.split('@');
  return `${user[0]}***@${domain}`;
}

function maskPhone(phone) {
  if (!phone) return '***';
  if (phone.length <= 4) return '***';
  return phone.slice(0, 3) + '******' + phone.slice(-4);
}

/**
 * Strips/masks PII fields (email, phone, street) for non-Admin roles.
 * Admin receives the full unmasked object.
 * Doctor and Nurse retain all clinical/medical attributes (name, blood_group, dob, age,
 * gender, total_donations, last_donation, is_eligible, city, state) but contact PII is masked.
 */
function applyDonorPiiPolicy(donorObj, role) {
  if (!donorObj) return donorObj;
  if (role === 'Admin') {
    return {
      ...donorObj,
      piiRestricted: false
    };
  }
  // Doctor and Nurse: mask direct contact PII while preserving clinical metadata
  return {
    ...donorObj,
    email: donorObj.email ? maskEmail(donorObj.email) : null,
    phone: donorObj.phone ? maskPhone(donorObj.phone) : null,
    street: '[Protected — Admin Access Required]',
    piiRestricted: true
  };
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

/**
 * Admin, Doctor, Nurse: Expand a node's neighboring relationships in the graph.
 * GET /api/graph/expand/:type/:id
 */
exports.expandNode = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const role = req.user && req.user.role;
    const result = await graphSyncService.expandNode(type, id);

    // Apply PII policy to all donor nodes
    const sanitizedNodes = result.nodes.map(n => {
      if (n.type === 'Donor' && n.props) {
        return {
          ...n,
          props: applyDonorPiiPolicy(n.props, role)
        };
      }
      return n;
    });

    let sanitizedCenter = result.centerEntity;
    if (result.centerEntity && (type.toLowerCase() === 'donor' || result.centerEntity.donor_id)) {
      sanitizedCenter = applyDonorPiiPolicy(result.centerEntity, role);
    }

    res.json({
      success: true,
      data: {
        nodes: sanitizedNodes,
        links: result.links,
        source: result.source,
        centerEntity: sanitizedCenter
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Expand node error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to expand graph node.' });
  }
};

/**
 * Admin, Doctor, Nurse: Get comprehensive authoritative details for a graph entity.
 * GET /api/graph/details/:type/:id
 */
exports.getNodeDetails = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const role = req.user && req.user.role;
    const details = await graphSyncService.getNodeDetails(type, id);

    let sanitized = { ...details };
    if (sanitized.type === 'Donor' && sanitized.data) {
      sanitized.data = applyDonorPiiPolicy(sanitized.data, role);
    }
    if (sanitized.donor) {
      sanitized.donor = applyDonorPiiPolicy(sanitized.donor, role);
    }

    res.json({
      success: true,
      data: sanitized
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Get node details error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve entity details.' });
  }
};
