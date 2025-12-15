import React, { useState, useEffect } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import useAxiosPrivate from '../../../hooks/useAxiosPrivate';
import { getAppIdString } from '../../../utils/idConverter';

const CHECKLIST_CATEGORIES = {
  unifiedApplicationForms: {
    title: '1. Unified Application Forms',
    items: [
      '4 notarized copies of the Unified Application Form',
      'Locational Clearance',
      'Fire Safety Evaluation Clearance'
    ]
  },
  additionalLocationalClearance: {
    title: '2. Additional Locational Clearance Requirements',
    items: [
      'CAAP Height Clearance (Tall Structures)',
      'Subdivision / HOA / Property Manager Clearance',
      'Initial Environmental Examination (IEE)',
      'Water Management Plan',
      'Historic Site / Facility Statement',
      'Drainage Impact Statement',
      'Socio-Economic Impact Statement',
      'Traffic Impact Assessment',
      'Line and Grade Clearance',
      'Waterways Clearance',
      'Flood Protection Evaluation',
      'Soil Test Report'
    ]
  },
  ownershipLandDocuments: {
    title: '3. Ownership / Land Documents',
    items: [
      'Original Certificate of Title / TCT (1 original + 3 photocopies)',
      'Contract of Lease (if applicable)',
      'Deed of Absolute Sale (if applicable)'
    ]
  },
  specialDocuments: {
    title: '4. Special Documents',
    items: [
      'Special Power of Attorney (SPA) or Secretary\'s Certificate'
    ]
  },
  buildingSurveyPlans: {
    title: '5. Building & Survey Plans (Signed & Sealed)',
    items: [
      'Architectural Documents',
      'Civil / Structural Documents',
      'Electrical Documents',
      'Mechanical Documents',
      'Sanitary Documents',
      'Plumbing Documents',
      'Electronics Documents',
      'Geodetic Documents',
      'Fire Protection Plan'
    ]
  },
  professionalDocuments: {
    title: '6. Professional Documents',
    items: [
      'PRC License (all involved professionals)',
      'PTR Receipts'
    ]
  },
  constructionDetails: {
    title: '7. Construction Details',
    items: [
      'Estimated Total Construction Cost Sheet',
      'Construction Safety & Health Program (CSHP)',
      'Construction Logbook'
    ]
  },
  others: {
    title: '8. Others',
    items: [
      'Affidavit of Undertaking'
    ]
  }
};

export default function AdminChecklist({ app, role, onUpdate }) {
  const axiosPrivate = useAxiosPrivate();
  const [checklist, setChecklist] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customFlagNote, setCustomFlagNote] = useState('');

  const canManageChecklist = role === 'meoadmin' || role === 'bfpadmin';

  // Initialize checklist 
  useEffect(() => {
    const initialChecklist = {};
    
    Object.keys(CHECKLIST_CATEGORIES).forEach(categoryKey => {
      const category = CHECKLIST_CATEGORIES[categoryKey];
      const appChecklistData = app.adminChecklist?.[categoryKey] || [];
      
      initialChecklist[categoryKey] = category.items.map((item, index) => {
        const existingData = appChecklistData.find(d => d.item === item);
        return existingData || {
          item,
          checked: false,
          flagged: false,
          resolvedBy: null,
          resolvedAt: null
        };
      });
    });
    
    setChecklist(initialChecklist);
    setSelectedItems([]);
  }, [app]);

  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const handleItemSelection = (categoryKey, itemIndex) => {
    const itemKey = `${categoryKey}-${itemIndex}`;
    setSelectedItems(prev => {
      if (prev.includes(itemKey)) {
        return prev.filter(key => key !== itemKey);
      } else {
        return [...prev, itemKey];
      }
    });
  };

  const isItemSelected = (categoryKey, itemIndex) => {
    return selectedItems.includes(`${categoryKey}-${itemIndex}`);
  };

  const handleFlagSelected = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to flag.');
      return;
    }

    const updatedChecklist = { ...checklist };
    const flaggedItemNames = [];

    selectedItems.forEach(itemKey => {
      const [categoryKey, itemIndex] = itemKey.split('-');
      const item = updatedChecklist[categoryKey][parseInt(itemIndex)];
      
      if (!item.flagged) {
        item.flagged = true;
        item.resolvedBy = null;
        item.resolvedAt = null;
        flaggedItemNames.push(item.item);
      }
    });

    if (flaggedItemNames.length === 0) {
      alert('All selected items are already flagged.');
      return;
    }

    setChecklist(updatedChecklist);
    setSelectedItems([]);
    
    // Save to backend
    await saveBatchFlagging(updatedChecklist, flaggedItemNames, true);
  };

  const handleResolveSelected = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to resolve.');
      return;
    }

    const updatedChecklist = { ...checklist };
    const resolvedItemNames = [];

    selectedItems.forEach(itemKey => {
      const [categoryKey, itemIndex] = itemKey.split('-');
      const item = updatedChecklist[categoryKey][parseInt(itemIndex)];
      
      if (item.flagged) {
        item.flagged = false;
        item.resolvedBy = role;
        item.resolvedAt = new Date();
        resolvedItemNames.push(item.item);
      }
    });

    if (resolvedItemNames.length === 0) {
      alert('All selected items are already resolved.');
      return;
    }

    setChecklist(updatedChecklist);
    setSelectedItems([]);
    
    // Save to backend
    await saveBatchFlagging(updatedChecklist, resolvedItemNames, false);
  };

  const saveBatchFlagging = async (updatedChecklist, itemNames, isFlagging) => {
    try {
      setIsLoading(true);
      
      // Use the utility function to convert app ID to string
      console.log('DEBUG: Full app object:', app);
      console.log('DEBUG: app._id type:', typeof app._id);
      console.log('DEBUG: app._id value:', app._id);
      
      let appIdString;
      try {
        appIdString = getAppIdString(app);
        console.log('DEBUG: Converted app ID:', appIdString, 'Length:', appIdString?.length);
      } catch (conversionError) {
        console.error('Error converting app ID:', conversionError);
        console.error('App object:', app);
        throw new Error('Failed to convert application ID: ' + conversionError.message);
      }
      
      // Validate the ID is a valid MongoDB ObjectId format (24 hex characters)
      if (!appIdString || !/^[a-f\d]{24}$/i.test(appIdString)) {
        console.error('Invalid ObjectId format:', appIdString);
        throw new Error(`Invalid application ID format: ${appIdString}`);
      }
      
      const currentMissingDocs = app.rejectionDetails?.missingDocuments || [];
      let newMissingDocs = [...currentMissingDocs];

      if (isFlagging) {
        // Add flagged items to missing documents
        itemNames.forEach(itemName => {
          if (!newMissingDocs.includes(itemName)) {
            newMissingDocs.push(itemName);
          }
        });
      } else {
        // Remove resolved items from missing documents
        newMissingDocs = newMissingDocs.filter(doc => !itemNames.includes(doc));
      }

      // Build comments: combine custom note with flagged items
      const customNote = customFlagNote.trim();
      let finalComments = app.rejectionDetails?.comments || '';
      
      if (isFlagging) {
        // When flagging, append the custom note if provided
        if (customNote) {
          finalComments = customNote;
        } else {
          finalComments = `Missing or incomplete documents flagged: ${itemNames.join(', ')}`;
        }
      }

      const updateData = {
        adminChecklist: updatedChecklist,
        rejectionDetails: {
          comments: finalComments,
          missingDocuments: newMissingDocs,
          isResolved: newMissingDocs.length === 0
        }
      };

      // If flagging items, change status to Rejected
      if (isFlagging && newMissingDocs.length > 0) {
        updateData.status = 'Rejected';
        updateData.comments = finalComments;
        
        // Use status update endpoint to properly reject and add to workflow history
        await axiosPrivate.put(`/api/applications/${appIdString}/status`, updateData);
      } else {
        // Just update checklist without changing status
        await axiosPrivate.put(`/api/applications/${appIdString}/checklist`, updateData);
      }

      setCustomFlagNote('');
      
      const successMessage = isFlagging 
        ? `Successfully flagged ${itemNames.length} item(s) and marked application as Rejected.`
        : `Successfully resolved ${itemNames.length} item(s).`;
      
      alert(successMessage + '\n\nPlease close and reopen this modal to see the updated data.');
      
    } catch (error) {
      console.error('Error saving checklist:', error);
      alert('Failed to save checklist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get all flagged items
  const getFlaggedItems = () => {
    const flagged = [];
    Object.keys(checklist).forEach(categoryKey => {
      const categoryItems = checklist[categoryKey] || [];
      categoryItems.forEach((item, index) => {
        if (item.flagged) {
          flagged.push({
            categoryKey,
            itemIndex: index,
            item: item.item,
            categoryTitle: CHECKLIST_CATEGORIES[categoryKey].title
          });
        }
      });
    });
    return flagged;
  };

  const flaggedItems = getFlaggedItems();

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      
      {/* FLAGGED ITEMS SECTION */}
      {flaggedItems.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h5 className="text-sm font-bold text-red-800 mb-3">Flagged Items ({flaggedItems.length})</h5>
          <div className="space-y-2">
            {flaggedItems.map((flagged, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-3 bg-white rounded border border-red-200">
                {canManageChecklist && (
                  <input
                    type="checkbox"
                    checked={isItemSelected(flagged.categoryKey, flagged.itemIndex)}
                    onChange={() => handleItemSelection(flagged.categoryKey, flagged.itemIndex)}
                    className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{flagged.item}</p>
                  <p className="text-xs text-gray-500 mt-1">{flagged.categoryTitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BATCH ACTION CONTROLS */}
      {canManageChecklist && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="mb-3">
            <span className="text-sm font-semibold text-gray-700">
              Selected: <span className="text-blue-600">{selectedItems.length}</span> item(s)
            </span>
            {selectedItems.length > 0 && (
              <button
                onClick={() => setSelectedItems([])}
                className="ml-3 text-xs text-gray-600 hover:text-gray-800 underline"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="mb-3">
            <input
              type="text"
              value={customFlagNote}
              onChange={(e) => setCustomFlagNote(e.target.value)}
              placeholder="e.g., Missing signature on page 3"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleFlagSelected}
              disabled={isLoading || selectedItems.length === 0}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm font-medium rounded transition disabled:cursor-not-allowed"
            >
              Flag Selected
            </button>
            <button
              onClick={handleResolveSelected}
              disabled={isLoading || selectedItems.length === 0}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-medium rounded transition disabled:cursor-not-allowed"
            >
              Resolve Selected
            </button>
          </div>
        </div>
      )}

      {/* CHECKLIST OF REQUIREMENTS SECTION */}
      <div className="mb-4">
        <h5 className="text-md font-bold text-gray-800 mb-3">Checklist of Requirements</h5>
        {!canManageChecklist && (
          <p className="text-sm text-gray-500 italic mb-3">
            Only MEO and BFP admins can manage this checklist.
          </p>
        )}
      </div>

      <div className="space-y-2">
        {Object.keys(CHECKLIST_CATEGORIES).map(categoryKey => {
          const category = CHECKLIST_CATEGORIES[categoryKey];
          const isExpanded = expandedCategories[categoryKey];
          const categoryItems = checklist[categoryKey] || [];

          return (
            <div key={categoryKey} className="border border-gray-200 rounded overflow-hidden">
              <button
                onClick={() => toggleCategory(categoryKey)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-800">{category.title}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="p-3 bg-white space-y-2">
                  {categoryItems.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={`flex items-start gap-3 p-2 rounded border transition ${
                        isItemSelected(categoryKey, itemIndex)
                          ? 'bg-blue-50 border-blue-300'
                          : item.flagged
                          ? 'bg-red-50 border-red-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {canManageChecklist && (
                        <input
                          type="checkbox"
                          checked={isItemSelected(categoryKey, itemIndex)}
                          onChange={() => handleItemSelection(categoryKey, itemIndex)}
                          className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      )}
                      <span className="text-sm text-gray-800 flex-1">{item.item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isLoading && (
        <div className="mt-3 text-center">
          <span className="text-xs text-blue-600 italic">Saving...</span>
        </div>
      )}
    </div>
  );
}
