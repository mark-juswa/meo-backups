import LandUseApplication from '../models/LandUseApplication.js';

// GET /api/pre-application/land-use/latest-verified
export const getLatestVerifiedLandUse = async (req, res) => {
  try {
    const applicantId = req.user.userId;

    const doc = await LandUseApplication.findOne({ applicant: applicantId, status: 'Verified' })
      .sort({ updatedAt: -1 })
      .lean();

    if (!doc) {
      return res.status(404).json({ message: 'No verified Land Use / Zoning record found.' });
    }

    return res.status(200).json({ landUseApplication: doc });
  } catch (error) {
    console.error('getLatestVerifiedLandUse error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
