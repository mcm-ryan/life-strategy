export function buildPrompt(data: Record<string, string>): string {
  const height = data.heightFt
    ? `${data.heightFt}'${data.heightIn ?? '0'}"`
    : 'Not provided'

  return `Please create a comprehensive life strategy for the following person:

**Personal Information:**
- Name: ${data.name || 'Not provided'}
- Age: ${data.age || 'Not provided'}
- Weight: ${data.weight ? `${data.weight} ${data.weightUnit || ''}` : 'Not provided'}
- Height: ${height}

**Health & Wellness:**
- Fitness Level: ${data.fitnessLevel || 'Not provided'}
- Sleep: ${data.sleepHours ? `${data.sleepHours} hours/night` : 'Not provided'}
- Target Weight: ${data.targetWeight ? `${data.targetWeight} ${data.weightUnit || 'lbs'}` : 'Not provided'}
- Current Daily Steps: ${data.dailySteps ? `${data.dailySteps} steps/day` : 'Not provided'}
- Health Goals: ${data.healthGoals || 'Not provided'}
- Diet: ${data.dietDescription || 'Not provided'}

**Interests & Skills:**
- Hobbies: ${data.hobbies || 'Not provided'}
- What brings joy: ${data.joyActivities || 'Not provided'}
- Skills: ${data.skills || 'Not provided'}

**Career:**
- Occupation: ${data.currentOccupation || 'Not provided'}
- Experience: ${data.yearsExperience ? `${data.yearsExperience} years` : 'Not provided'}
- Career Satisfaction: ${data.careerSatisfaction ? `${data.careerSatisfaction}/10` : 'Not provided'}
- Career Goals: ${data.careerGoals || 'Not provided'}

**Finances:**
- Annual Income: ${data.annualIncome || 'Not provided'}
- Net Worth: ${data.netWorth || 'Not provided'}
- Monthly Savings Capacity: ${data.monthlySavings ? `$${data.monthlySavings}/month` : 'Not provided'}
- Financial Goals: ${data.financialGoals || 'Not provided'}
- Financial Challenges: ${data.financialChallenges || 'Not provided'}

**Life Vision:**
- Definition of happiness: ${data.happinessDefinition || 'Not provided'}
- 1-Year Goals: ${data.shortTermGoals || 'Not provided'}
- 5+ Year Goals: ${data.longTermGoals || 'Not provided'}
- Biggest Obstacle: ${data.biggestObstacle || 'Not provided'}

Please provide a detailed, actionable strategy to help ${data.name || 'this person'} progress toward being happy, healthy, and wealthy. Remember to append the ---GOALS_JSON--- block at the very end.`
}
