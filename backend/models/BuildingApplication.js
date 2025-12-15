import mongoose from 'mongoose';

const Schema = mongoose.Schema;


const Box1Schema = new Schema({
    owner: {
        lastName: { type: String, required: true },
        firstName: { type: String, required: true },
        middleInitial: { type: String },
        tin: { type: Number } 
    },
    enterprise: {
        formOfOwnership: { type: String }, 
        projectTitle: { type: String },
        address: {
            no: { type: Number },
            street: { type: String },
            barangay: { type: String },
            city: { type: String },
            zip: { type: Number },
            telNo: { type: Number }
        }
    },
    location: {
        lotNo: { type: String },
        blkNo: { type: Number }, 
        tctNo: { type: Number },
        taxDecNo: { type: Number },
        street: { type: String, required: true },
        barangay: { type: String, required: true },
        city: { type: String, required: true }
    },
    scopeOfWork: [{ type: String }],

    occupancy: {
        group: { type: String, required: true },
        classified: { type: String }
    },

    projectDetails: {
        numberOfUnits: { type: Number },
        totalEstimatedCost: { type: Number, required: true },
        totalFloorArea: { type: Number },
        lotArea: { type: Number },
        proposedConstruction: { type: Date },
        expectedCompletion: { type: Date }
    }
});


// ARCHITECT / ENGINEER (To be filled by professionals only)
const Box2Schema = new Schema({
    name: { type: String },
    date: { type: Date },
    address: { type: String },
    prcNo: { type: Number }, 
    validity: { type: Date },
    ptrNo: { type: Number }, 
    ptrDate: { type: Date },
    issuedAt: { type: String },
    tin: { type: Number }
});


// APPLICANT SIGNATURE

const Box3Schema = new Schema({
    name: { type: String, required: true },
    date: { type: Date },
    address: { type: String },
    ctcNo: { type: Number }, 
    dateIssued: { type: Date }, 
    placeIssued: { type: String } 
});


// LOT OWNER CONSENT

const Box4Schema = new Schema({
    name: { type: String },
    date: { type: Date },        
    address: { type: String },
    tctNo: { type: Number }, 
    taxDecNo: { type: Number }, 
    placeIssued: { type: String } 
});


// NOTARY
const Box5Schema = new Schema({
    assessedBy: { type: String },
    reviewedBy: { type: String },
    notedBy: { type: String },
    date: { type: Date, default: Date.now },


    docNo: String,
    pageNo: String,
    bookNo: String,
    seriesOf: String,
    notaryPublicDate: Date
});


// FEES (MEO)

const FeeItemSchema = new Schema({
    particular: { type: String, required: true },
    amount: { type: Number, required: true }
});

const Box6Schema = new Schema({
    fees: [FeeItemSchema],
    totalAmountDue: { type: Number, default: 0 },
});


// MAIN APPLICATION SCHEMA (YUNG NASA DB)

const BuildingApplicationSchema = new Schema(
    {
        applicant: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        applicationType: { type: String, default: 'Building' },
        referenceNo: { type: String, unique: true },

        status: {
            type: String,
            enum: [
                'Submitted',
                'Pending MEO',
                'Pending BFP',
                'Pending Mayor',
                'Approved',
                'Rejected',
                'Payment Pending',
                'Payment Submitted',
                'Permit Issued',
            ],
            default: 'Submitted',
        },

        box1: Box1Schema,
        box2: Box2Schema,
        box3: Box3Schema,
        box4: Box4Schema,
        box5: { type: Box5Schema, default: {} },
        box6: { type: Box6Schema, default: {} },

        rejectionDetails: {
            comments: { type: String, default: '' },
            missingDocuments: [{ type: String }],
            status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
            isResolved: { type: Boolean, default: false }
        },

        adminChecklist: {
            unifiedApplicationForms: [{ 
                item: { type: String },
                checked: { type: Boolean, default: false },
                flagged: { type: Boolean, default: false },
                resolvedBy: { type: String, default: null },
                resolvedAt: { type: Date, default: null }
            }],
            additionalLocationalClearance: [{
                item: { type: String },
                checked: { type: Boolean, default: false },
                flagged: { type: Boolean, default: false },
                resolvedBy: { type: String, default: null },
                resolvedAt: { type: Date, default: null }
            }],
            ownershipLandDocuments: [{
                item: { type: String },
                checked: { type: Boolean, default: false },
                flagged: { type: Boolean, default: false },
                resolvedBy: { type: String, default: null },
                resolvedAt: { type: Date, default: null }
            }],
            specialDocuments: [{
                item: { type: String },
                checked: { type: Boolean, default: false },
                flagged: { type: Boolean, default: false },
                resolvedBy: { type: String, default: null },
                resolvedAt: { type: Date, default: null }
            }],
            buildingSurveyPlans: [{
                item: { type: String },
                checked: { type: Boolean, default: false },
                flagged: { type: Boolean, default: false },
                resolvedBy: { type: String, default: null },
                resolvedAt: { type: Date, default: null }
            }],
            professionalDocuments: [{
                item: { type: String },
                checked: { type: Boolean, default: false },
                flagged: { type: Boolean, default: false },
                resolvedBy: { type: String, default: null },
                resolvedAt: { type: Date, default: null }
            }],
            constructionDetails: [{
                item: { type: String },
                checked: { type: Boolean, default: false },
                flagged: { type: Boolean, default: false },
                resolvedBy: { type: String, default: null },
                resolvedAt: { type: Date, default: null }
            }],
            others: [{
                item: { type: String },
                checked: { type: Boolean, default: false },
                flagged: { type: Boolean, default: false },
                resolvedBy: { type: String, default: null },
                resolvedAt: { type: Date, default: null }
            }]
        },

        documents: [
            {
                requirementName: { type: String, required: true },
                fileName: { type: String, required: true },
                filePath: { type: String }, 
                fileContent: { type: String }, 
                mimeType: { type: String }, 
                fileSize: { type: Number }, 
                uploadedAt: { type: Date, default: Date.now },
                uploadedBy: { type: String, default: 'user' } 
            },
        ],

        permit: {
            permitNumber: { type: String },
            issuedAt: { type: Date },
            issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        },

        workflowHistory: [
            {
                status: { type: String, required: true },
                comments: { type: String },
                updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
                timestamp: { type: Date, default: Date.now },
            },
        ],

        paymentDetails: {
            method: { type: String, enum: ['Walk-In', 'Online'], default: null },
            status: { type: String, enum: ['Pending', 'Verified', 'Failed'], default: 'Pending' },
            referenceNumber: { type: String },
            proofOfPaymentFile: { type: String }, 
            paymentProof: {
                fileName: { type: String },
                fileContent: { type: String }, 
                mimeType: { type: String },
                fileSize: { type: Number }
            },
            dateSubmitted: { type: Date },
            amountPaid: { type: Number }
        },
    },
    { timestamps: true }
);


async function generateMEOPermitNumber(prefix) {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2); // Last 2 digits of year
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Month 01-12
    const yearMonth = year + month; //

    // Find the last permit number for this month
    const regex = new RegExp(`^${prefix}-${yearMonth}\\d{6}$`);
    const lastApplication = await mongoose.model('BuildingApplication')
        .findOne({ referenceNo: regex })
        .sort({ referenceNo: -1 })
        .select('referenceNo')
        .lean();

    let sequence = 1;
    if (lastApplication && lastApplication.referenceNo) {
        // Extract the last 6 digits and increment
        const lastSequence = parseInt(lastApplication.referenceNo.slice(-6), 10);
        sequence = lastSequence + 1;
    }

    const sequenceStr = String(sequence).padStart(6, '0');
    return `${prefix}-${yearMonth}${sequenceStr}`;
}

// GENERATE REFERENCE NO.
BuildingApplicationSchema.pre('save', async function (next) {
    if (this.isNew && !this.referenceNo) {
        this.referenceNo = await generateMEOPermitNumber('B');
    }
    next();
});

export default mongoose.model('BuildingApplication', BuildingApplicationSchema);
