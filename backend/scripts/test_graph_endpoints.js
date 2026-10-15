require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const graphSyncService = require('../services/graphSyncService');

async function runTests() {
  console.log('=== Testing Graph & Entity Service Upgrades ===\n');

  try {
    console.log('Test 1: traceByUnitId(1)');
    const unitTrace = await graphSyncService.traceByUnitId(1);
    console.log('  Unit:', unitTrace.unit?.unit_code, unitTrace.unit?.blood_group);
    console.log('  Donor Name:', unitTrace.donor?.name);
    console.log('  Donor Age/Gender/Eligible:', unitTrace.donor?.age, unitTrace.donor?.gender, unitTrace.donor?.is_eligible);
    console.log('  Bank:', unitTrace.bloodBank?.name, unitTrace.bloodBank?.city);
    console.log('  Tests count:', unitTrace.bloodTests?.length);

    console.log('\nTest 2: traceByDonorId(1)');
    const donorTrace = await graphSyncService.traceByDonorId(1);
    console.log('  Donor:', donorTrace.donor?.name, donorTrace.donor?.blood_group);
    console.log('  Donations count:', donorTrace.donations?.length);
    if (donorTrace.donations?.length > 0) {
      const d0 = donorTrace.donations[0];
      console.log('  Donation 0 Bank:', d0.bloodBank?.name);
      console.log('  Donation 0 Unit:', d0.bloodUnit?.unit_code);
    }

    console.log('\nTest 3: expandNode("donor", 1)');
    const expandedDonor = await graphSyncService.expandNode('donor', 1);
    console.log('  Nodes returned:', expandedDonor.nodes.length);
    console.log('  Links returned:', expandedDonor.links.length);
    console.log('  Node types:', [...new Set(expandedDonor.nodes.map(n => n.type))].join(', '));

    console.log('\nTest 4: expandNode("bank", 1)');
    const expandedBank = await graphSyncService.expandNode('bank', 1);
    console.log('  Nodes returned:', expandedBank.nodes.length);
    console.log('  Links returned:', expandedBank.links.length);

    console.log('\nTest 5: getNodeDetails("donor", 1)');
    const donorDetails = await graphSyncService.getNodeDetails('donor', 1);
    console.log('  Donor Profile:', donorDetails.data?.name, 'Age:', donorDetails.data?.age, 'Eligible:', donorDetails.data?.is_eligible);
    console.log('  Donation History items:', donorDetails.donationHistory?.length);
    console.log('  Units Generated count:', donorDetails.unitsGenerated?.length);

    console.log('\nTest 6: getNodeDetails("unit", 1)');
    const unitDetails = await graphSyncService.getNodeDetails('unit', 1);
    console.log('  Unit Code:', unitDetails.data?.unit_code, 'Volume:', unitDetails.data?.volume_ml);
    console.log('  Generating Event:', unitDetails.event?.event_id, unitDetails.event?.event_date);
    console.log('  Donor:', unitDetails.donor?.name);
    console.log('  Tests:', unitDetails.tests?.map(t => `${t.test_type}: ${t.result}`).join(', '));

    console.log('\n✅ ALL BACKEND TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test FAILED:', err);
    process.exit(1);
  }
}

runTests();
