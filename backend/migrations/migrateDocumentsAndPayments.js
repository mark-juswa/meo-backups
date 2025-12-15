// migrations/migrateDocumentsAndPayments.js
// Migration script to extract embedded documents and payments into separate collections

import mongoose from 'mongoose';
import BuildingApplication from '../models/BuildingApplication.js';
import OccupancyApplication from '../models/OccupancyApplication.js';
import Document from '../models/Document.js';
import Payment from '../models/Payment.js';

/**
 * MIGRATION SCRIPT
 * Extracts embedded documents and payments from applications into separate collections
 */
class DataMigration {
  constructor() {
    this.stats = {
      totalApplications: 0,
      documentsMigrated: 0,
      paymentsMigrated: 0,
      errors: []
    };
  }

  /**
   * Main migration function
   */
  async migrate() {
    console.log('🚀 Starting data migration...\n');
    console.log('⚠️  This will extract documents and payments from embedded fields\n');

    try {
      // Connect to MongoDB
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/meo_db');
        console.log('✅ Connected to MongoDB\n');
      }

      // Migrate Building Applications
      console.log('📋 Migrating Building Applications...');
      await this.migrateApplicationType(BuildingApplication, 'Building');

      // Migrate Occupancy Applications
      console.log('\n📋 Migrating Occupancy Applications...');
      await this.migrateApplicationType(OccupancyApplication, 'Occupancy');

      // Print summary
      this.printSummary();

      // Validate migration
      await this.validateMigration();

      console.log('\n✅ Migration completed successfully!');
      console.log('⚠️  IMPORTANT: Embedded fields are NOT removed. They remain as backup.');
      console.log('📝 To use the new structure, ensure your application uses the adapter.');

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Migrate applications of a specific type
   */
  async migrateApplicationType(Model, applicationType) {
    const applications = await Model.find({});
    console.log(`   Found ${applications.length} ${applicationType} applications`);

    for (const application of applications) {
      await this.migrateApplication(application, applicationType);
    }
  }

  /**
   * Migrate a single application
   */
  async migrateApplication(application, applicationType) {
    this.stats.totalApplications++;
    const appId = application._id;
    const refNo = application.referenceNo || appId;

    try {
      // Migrate Documents
      if (application.documents && application.documents.length > 0) {
        console.log(`   📄 Migrating ${application.documents.length} documents for ${refNo}...`);

        for (let index = 0; index < application.documents.length; index++) {
          const embeddedDoc = application.documents[index];

          // Check if already migrated
          const existing = await Document.findOne({
            applicationId: appId,
            originalIndex: index,
            requirementName: embeddedDoc.requirementName
          });

          if (existing) {
            console.log(`      ⏭️  Document[${index}] already migrated: ${embeddedDoc.requirementName}`);
            continue;
          }

          // Create new document in separate collection
          const newDoc = new Document({
            applicationId: appId,
            applicationType: applicationType,
            requirementName: embeddedDoc.requirementName,
            fileName: embeddedDoc.fileName,
            fileContent: embeddedDoc.fileContent,
            mimeType: embeddedDoc.mimeType,
            fileSize: embeddedDoc.fileSize,
            uploadedBy: embeddedDoc.uploadedBy || 'user',
            uploadedAt: embeddedDoc.uploadedAt || application.createdAt,
            originalIndex: index, // CRITICAL: Preserve array position
            filePath: embeddedDoc.filePath || null,
            isActive: true
          });

          await newDoc.save();
          this.stats.documentsMigrated++;
          console.log(`      ✅ Document[${index}] migrated: ${embeddedDoc.requirementName}`);
        }
      }

      // Migrate Payment
      if (application.paymentDetails && application.paymentDetails.method) {
        console.log(`   💳 Migrating payment for ${refNo}...`);

        // Check if already migrated
        const existingPayment = await Payment.findOne({ applicationId: appId });

        if (existingPayment) {
          console.log(`      ⏭️  Payment already migrated`);
        } else {
          const embeddedPayment = application.paymentDetails;

          const newPayment = new Payment({
            applicationId: appId,
            applicationType: applicationType,
            method: embeddedPayment.method,
            status: embeddedPayment.status || 'Pending',
            referenceNumber: embeddedPayment.referenceNumber,
            amountPaid: embeddedPayment.amountPaid,
            dateSubmitted: embeddedPayment.dateSubmitted,
            proofOfPaymentFile: embeddedPayment.proofOfPaymentFile,
            paymentProof: embeddedPayment.paymentProof,
            isActive: true
          });

          await newPayment.save();
          this.stats.paymentsMigrated++;
          console.log(`      ✅ Payment migrated`);
        }
      }

      console.log(`   ✅ Application ${refNo} migration complete`);

    } catch (error) {
      console.error(`   ❌ Error migrating application ${refNo}:`, error.message);
      this.stats.errors.push({
        applicationId: appId,
        referenceNo: refNo,
        error: error.message
      });
    }
  }

  /**
   * Print migration summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Applications Processed: ${this.stats.totalApplications}`);
    console.log(`Documents Migrated: ${this.stats.documentsMigrated}`);
    console.log(`Payments Migrated: ${this.stats.paymentsMigrated}`);
    console.log(`Errors: ${this.stats.errors.length}`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.stats.errors.forEach(err => {
        console.log(`   ${err.referenceNo}: ${err.error}`);
      });
    }
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Validate migration integrity
   */
  async validateMigration() {
    console.log('🔍 Validating migration...\n');

    const buildingApps = await BuildingApplication.find({});
    const occupancyApps = await OccupancyApplication.find({});
    const allApps = [...buildingApps, ...occupancyApps];

    let validationErrors = 0;

    for (const app of allApps) {
      const appId = app._id;
      const embeddedDocCount = app.documents ? app.documents.length : 0;
      const separateDocCount = await Document.countDocuments({
        applicationId: appId,
        isActive: true
      });

      if (embeddedDocCount !== separateDocCount) {
        console.error(`❌ ${app.referenceNo}: Document count mismatch (embedded=${embeddedDocCount}, separate=${separateDocCount})`);
        validationErrors++;
      }

      // Check payment
      const hasEmbeddedPayment = app.paymentDetails && app.paymentDetails.method;
      const hasSeparatePayment = await Payment.exists({ applicationId: appId });

      if (hasEmbeddedPayment && !hasSeparatePayment) {
        console.error(`❌ ${app.referenceNo}: Payment missing in separate collection`);
        validationErrors++;
      }
    }

    if (validationErrors === 0) {
      console.log('✅ Validation passed: All data migrated successfully');
    } else {
      console.error(`\n❌ Validation failed: ${validationErrors} errors found`);
      throw new Error('Migration validation failed');
    }
  }
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migration = new DataMigration();
  migration.migrate()
    .then(() => {
      console.log('\n✅ Migration complete! You can now use the separated collections.');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

export default DataMigration;
