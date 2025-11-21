interface SkillReview {
  skill: string;
  section: string;
  expectation: number;
  selfRating: number;
  managerRating: number;
  gap: number;
}

interface EmployeeData {
  name: string;
  employee_id: string;
  email: string;
  additional_skills?: string;
}

interface PrintReviewProps {
  employee: EmployeeData;
  skillReviews: SkillReview[];
  overallManagerReview: string;
  radarChartImage?: string;
}

// Function to convert image to base64
const getLogoAsBase64 = async (): Promise<string> => {
  try {
    // Import the logo - Vite will handle this correctly in both dev and production
    const logoModule = await import('../../assets/logo.png');
    const logoUrl = logoModule.default;

    // Fetch and convert to base64
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading logo:', error);
    return '';
  }
};

const RATING_LABELS: Record<number, string> = {
  0: 'Not rated',
  1: 'No Knowledge',
  2: 'Novice',
  3: 'Proficient',
  4: 'Expert',
  5: 'Advanced'
};

export const printReview = async ({
  employee,
  skillReviews,
  overallManagerReview,
  radarChartImage
}: PrintReviewProps) => {
  // Get logo as base64
  const logoBase64 = await getLogoAsBase64();

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to print the review');
    return;
  }

  const printContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Employee Review - ${employee.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      color: #333;
      line-height: 1.6;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
      border-bottom: 3px solid #4F46E5;
      padding-bottom: 20px;
    }
    .header-logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .header-content {
      text-align: left;
    }
    .header h1 {
      color: #4F46E5;
      font-size: 28px;
      margin-bottom: 5px;
    }
    .header p {
      color: #6B7280;
      font-size: 14px;
      margin: 0;
    }
    .employee-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
      padding: 15px;
      background: #F3F4F6;
      border-radius: 8px;
    }
    .info-item {
      text-align: center;
    }
    .info-label {
      font-size: 12px;
      color: #6B7280;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 16px;
      font-weight: bold;
      color: #1F2937;
    }
    .side-by-side-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
      page-break-inside: avoid;
    }
    .side-by-side-container > *:only-child {
      grid-column: 1 / -1;
    }
    .additional-skills {
      padding: 20px;
      background: #FEF3C7;
      border: 2px solid #F59E0B;
      border-radius: 8px;
      height: fit-content;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .additional-skills h3 {
      font-size: 14px;
      color: #92400E;
      margin-bottom: 12px;
      font-weight: bold;
    }
    .additional-skills p {
      font-size: 13px;
      color: #78350F;
      line-height: 1.6;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 12px;
    }
    thead {
      background: #4F46E5;
      color: white;
    }
    th {
      padding: 12px 8px;
      text-align: left;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11px;
    }
    th.center {
      text-align: center;
    }
    td {
      padding: 10px 8px;
      border-bottom: 1px solid #E5E7EB;
    }
    tbody tr:hover {
      background: #F9FAFB;
    }
    .skill-name {
      font-weight: bold;
      color: #1F2937;
    }
    .section-name {
      font-size: 10px;
      color: #6B7280;
      font-style: italic;
    }
    .rating-cell {
      text-align: center;
    }
    .stars {
      display: inline-flex;
      gap: 2px;
      margin-bottom: 3px;
    }
    .star {
      font-size: 14px;
      line-height: 1;
    }
    .star-filled {
      color: #FBBF24;
    }
    .star-empty {
      color: #D1D5DB;
      font-weight: 300;
    }
    .star-expectation-filled {
      color: #10B981;
    }
    .star-manager-filled {
      color: #3B82F6;
    }
    .rating-label {
      font-size: 10px;
      font-weight: bold;
      display: block;
    }
    .rating-label.expectation {
      color: #047857;
    }
    .rating-label.self {
      color: #374151;
    }
    .rating-label.manager {
      color: #1D4ED8;
    }
    .gap-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 11px;
    }
    .gap-positive {
      background: #D1FAE5;
      color: #065F46;
    }
    .gap-negative {
      background: #FEE2E2;
      color: #991B1B;
    }
    .gap-neutral {
      background: #F3F4F6;
      color: #4B5563;
    }
    .overall-review {
      padding: 20px;
      background: #EEF2FF;
      border: 2px solid #4F46E5;
      border-radius: 8px;
      height: fit-content;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .overall-review h3 {
      color: #4F46E5;
      font-size: 14px;
      margin-bottom: 12px;
      font-weight: bold;
    }
    .overall-review p {
      font-size: 13px;
      color: #1F2937;
      white-space: pre-line;
      line-height: 1.6;
    }
    .radar-chart-section {
      padding: 20px;
      background: linear-gradient(to bottom right, #EEF2FF, #F3E8FF);
      border-radius: 8px;
      text-align: center;
      page-break-before: always;
      page-break-inside: avoid;
      min-height: calc(100vh - 40px);
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .radar-chart-section h3 {
      color: #4F46E5;
      font-size: 16px;
      margin-bottom: 15px;
    }
    .radar-chart-section img {
      max-width: 100%;
      max-height: 70vh;
      height: auto;
      border-radius: 4px;
      margin-bottom: auto;
    }
    .radar-footer {
      margin-top: auto;
      padding-top: 20px;
      border-top: 2px solid #E5E7EB;
      text-align: center;
      font-size: 11px;
      color: #6B7280;
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
    }
    @media print {
      body {
        padding: 10px;
      }
      .header h1 {
        font-size: 24px;
      }
      table {
        font-size: 10px;
      }
      th, td {
        padding: 8px 6px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Company Logo" class="header-logo" />` : ''}
    <div class="header-content">
      <h1>Employee Skills Review Report</h1>
      <p>Comprehensive Skills Assessment and Manager Evaluation</p>
    </div>
  </div>

  <div class="employee-info">
    <div class="info-item">
      <div class="info-label">Employee Name</div>
      <div class="info-value">${employee.name}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Employee ID</div>
      <div class="info-value">${employee.employee_id}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Email</div>
      <div class="info-value">${employee.email}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Skill</th>
        <th class="center">Company Expectation</th>
        <th class="center">Self Rating</th>
        <th class="center">Manager Rating</th>
        <th class="center">Gap (Mgr - Self)</th>
      </tr>
    </thead>
    <tbody>
      ${skillReviews
        .map(
          review => `
        <tr>
          <td>
            <div class="skill-name">${review.skill}</div>
            <div class="section-name">${review.section}</div>
          </td>
          <td class="rating-cell">
            <div class="stars">
              ${[1, 2, 3, 4, 5]
                .map(
                  star =>
                    `<span class="star ${
                      star <= review.expectation ? 'star-expectation-filled' : 'star-empty'
                    }">${star <= review.expectation ? '★' : '☆'}</span>`
                )
                .join('')}
            </div>
            <span class="rating-label expectation">${RATING_LABELS[review.expectation]}</span>
          </td>
          <td class="rating-cell">
            <div class="stars">
              ${[1, 2, 3, 4, 5]
                .map(
                  star =>
                    `<span class="star ${
                      star <= review.selfRating ? 'star-filled' : 'star-empty'
                    }">${star <= review.selfRating ? '★' : '☆'}</span>`
                )
                .join('')}
            </div>
            <span class="rating-label self">${RATING_LABELS[review.selfRating]}</span>
          </td>
          <td class="rating-cell">
            <div class="stars">
              ${[1, 2, 3, 4, 5]
                .map(
                  star =>
                    `<span class="star ${
                      star <= review.managerRating ? 'star-manager-filled' : 'star-empty'
                    }">${star <= review.managerRating ? '★' : '☆'}</span>`
                )
                .join('')}
            </div>
            <span class="rating-label manager">${RATING_LABELS[review.managerRating]}</span>
          </td>
          <td class="rating-cell">
            ${
              review.managerRating > 0
                ? `<span class="gap-badge ${
                    review.gap > 0 ? 'gap-positive' : review.gap < 0 ? 'gap-negative' : 'gap-neutral'
                  }">
                  ${review.gap > 0 ? '↑' : review.gap < 0 ? '↓' : '−'} ${Math.abs(review.gap)}
                </span>`
                : '<span style="font-size: 10px; color: #9CA3AF; font-style: italic;">Not rated</span>'
            }
          </td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  ${
    overallManagerReview || employee.additional_skills
      ? `<div class="side-by-side-container">
      ${
        overallManagerReview
          ? `<div class="overall-review">
          <h3>Overall Manager Review</h3>
          <p>${overallManagerReview}</p>
        </div>`
          : ''
      }
      ${
        employee.additional_skills
          ? `<div class="additional-skills">
          <h3>Additional Skills / Domain Expertise</h3>
          <p>${employee.additional_skills}</p>
        </div>`
          : ''
      }
    </div>`
      : ''
  }

  ${
    radarChartImage
      ? `<div class="radar-chart-section">
      <h3>Skills Radar Chart</h3>
      <img src="${radarChartImage}" alt="Skills Radar Chart" />
      <div class="radar-footer">
        <p>Generated on ${new Date().toLocaleDateString('en-GB').split('/').join('-')} at ${new Date().toLocaleTimeString()}</p>
        <p>Employee Skills Review System</p>
      </div>
    </div>`
      : ''
  }

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

  printWindow.document.write(printContent);
  printWindow.document.close();
};
