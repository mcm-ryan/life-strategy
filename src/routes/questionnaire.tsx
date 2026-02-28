import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ChevronRight,
  ChevronLeft,
  User,
  Heart,
  Star,
  Briefcase,
  DollarSign,
  Target,
  CheckCircle,
} from 'lucide-react'

export const Route = createFileRoute('/questionnaire')({
  component: QuestionnairePage,
})

interface FormData {
  // Step 1: Personal
  name: string
  age: string
  weight: string
  weightUnit: string
  heightFt: string
  heightIn: string
  // Step 2: Health
  fitnessLevel: string
  sleepHours: string
  targetWeight: string
  dailySteps: string
  healthGoals: string
  dietDescription: string
  // Step 3: Interests
  hobbies: string
  joyActivities: string
  skills: string
  // Step 4: Career
  currentOccupation: string
  yearsExperience: string
  careerSatisfaction: string
  careerGoals: string
  // Step 5: Finances
  annualIncome: string
  netWorth: string
  monthlySavings: string
  financialGoals: string
  financialChallenges: string
  // Step 6: Life Goals
  happinessDefinition: string
  shortTermGoals: string
  longTermGoals: string
  biggestObstacle: string
}

const initialData: FormData = {
  name: '',
  age: '',
  weight: '',
  weightUnit: 'lbs',
  heightFt: '',
  heightIn: '',
  fitnessLevel: '',
  sleepHours: '',
  targetWeight: '',
  dailySteps: '',
  healthGoals: '',
  dietDescription: '',
  hobbies: '',
  joyActivities: '',
  skills: '',
  currentOccupation: '',
  yearsExperience: '',
  careerSatisfaction: '5',
  careerGoals: '',
  annualIncome: '',
  netWorth: '',
  monthlySavings: '',
  financialGoals: '',
  financialChallenges: '',
  happinessDefinition: '',
  shortTermGoals: '',
  longTermGoals: '',
  biggestObstacle: '',
}

const STEPS = [
  { label: 'About You', icon: User },
  { label: 'Health', icon: Heart },
  { label: 'Interests', icon: Star },
  { label: 'Career', icon: Briefcase },
  { label: 'Finances', icon: DollarSign },
  { label: 'Goals', icon: Target },
]

function inputClass() {
  return 'w-full bg-slate-700/60 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition placeholder:text-gray-500'
}

function textareaClass() {
  return `${inputClass()} resize-none`
}

function selectClass() {
  return `${inputClass()} cursor-pointer`
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-300 mb-1.5">
      {children}
    </label>
  )
}

export function QuestionnairePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(initialData)
  const [submitting, setSubmitting] = useState(false)

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => setData((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = () => {
    setSubmitting(true)
    sessionStorage.setItem('strategy_answers', JSON.stringify(data))
    void navigate({ to: '/strategy' })
  }

  const StepIcon = STEPS[step].icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1 flex-1 ${i < step ? 'text-cyan-400' : i === step ? 'text-white' : 'text-gray-600'}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                      i < step
                        ? 'bg-cyan-500 border-cyan-500'
                        : i === step
                          ? 'bg-slate-700 border-cyan-500'
                          : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    {i < step ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-xs hidden sm:block">{s.label}</span>
                </div>
              )
            })}
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <p className="text-right text-xs text-gray-500 mt-1">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {STEPS[step].label}
            </h2>
          </div>

          {/* Step 1: Personal */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Your name</Label>
                <input
                  className={inputClass()}
                  placeholder="e.g. Alex"
                  value={data.name}
                  onChange={set('name')}
                />
              </div>
              <div>
                <Label>Age</Label>
                <input
                  type="number"
                  className={inputClass()}
                  placeholder="e.g. 30"
                  value={data.age}
                  onChange={set('age')}
                  min={1}
                  max={120}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>Weight</Label>
                  <input
                    type="number"
                    className={inputClass()}
                    placeholder="e.g. 180"
                    value={data.weight}
                    onChange={set('weight')}
                    min={1}
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <select
                    className={selectClass()}
                    value={data.weightUnit}
                    onChange={set('weightUnit')}
                  >
                    <option value="lbs">lbs</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Height</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      className={inputClass()}
                      placeholder="ft"
                      value={data.heightFt}
                      onChange={set('heightFt')}
                      min={0}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      ft
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      className={inputClass()}
                      placeholder="in"
                      value={data.heightIn}
                      onChange={set('heightIn')}
                      min={0}
                      max={11}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      in
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Health */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Current fitness level</Label>
                <select
                  className={selectClass()}
                  value={data.fitnessLevel}
                  onChange={set('fitnessLevel')}
                >
                  <option value="">Select...</option>
                  <option value="sedentary">Sedentary (little to no exercise)</option>
                  <option value="lightly active">Lightly active (1-3 days/week)</option>
                  <option value="moderately active">Moderately active (3-5 days/week)</option>
                  <option value="very active">Very active (6-7 days/week)</option>
                  <option value="extremely active">Extremely active (athlete/physical job)</option>
                </select>
              </div>
              <div>
                <Label>Average sleep per night (hours)</Label>
                <input
                  type="number"
                  className={inputClass()}
                  placeholder="e.g. 7"
                  value={data.sleepHours}
                  onChange={set('sleepHours')}
                  min={1}
                  max={24}
                  step={0.5}
                />
              </div>
              <div>
                <Label>Target weight ({data.weightUnit || 'lbs'})</Label>
                <input
                  type="number"
                  className={inputClass()}
                  placeholder={`e.g. ${data.weightUnit === 'kg' ? '70' : '160'}`}
                  value={data.targetWeight}
                  onChange={set('targetWeight')}
                  min={1}
                />
              </div>
              <div>
                <Label>Approximate daily steps (current)</Label>
                <input
                  type="number"
                  className={inputClass()}
                  placeholder="e.g. 5000"
                  value={data.dailySteps}
                  onChange={set('dailySteps')}
                  min={0}
                  step={500}
                />
              </div>
              <div>
                <Label>Health goals or concerns</Label>
                <textarea
                  className={textareaClass()}
                  rows={3}
                  placeholder="e.g. Lose 20 lbs, manage stress, improve energy levels..."
                  value={data.healthGoals}
                  onChange={set('healthGoals')}
                />
              </div>
              <div>
                <Label>How would you describe your diet?</Label>
                <textarea
                  className={textareaClass()}
                  rows={3}
                  placeholder="e.g. I mostly eat fast food, rarely cook at home, drink too much coffee..."
                  value={data.dietDescription}
                  onChange={set('dietDescription')}
                />
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Hobbies & interests</Label>
                <textarea
                  className={textareaClass()}
                  rows={3}
                  placeholder="e.g. Photography, hiking, reading sci-fi, gaming, cooking..."
                  value={data.hobbies}
                  onChange={set('hobbies')}
                />
              </div>
              <div>
                <Label>What activities bring you the most joy?</Label>
                <textarea
                  className={textareaClass()}
                  rows={3}
                  placeholder="e.g. Spending time with family, creating things, helping others, traveling..."
                  value={data.joyActivities}
                  onChange={set('joyActivities')}
                />
              </div>
              <div>
                <Label>Skills you currently have (personal & professional)</Label>
                <textarea
                  className={textareaClass()}
                  rows={3}
                  placeholder="e.g. Programming, public speaking, design, writing, leadership..."
                  value={data.skills}
                  onChange={set('skills')}
                />
              </div>
            </div>
          )}

          {/* Step 4: Career */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Current occupation / field</Label>
                <input
                  className={inputClass()}
                  placeholder="e.g. Software engineer, nurse, sales manager..."
                  value={data.currentOccupation}
                  onChange={set('currentOccupation')}
                />
              </div>
              <div>
                <Label>Years of professional experience</Label>
                <input
                  type="number"
                  className={inputClass()}
                  placeholder="e.g. 5"
                  value={data.yearsExperience}
                  onChange={set('yearsExperience')}
                  min={0}
                />
              </div>
              <div>
                <Label>
                  Career satisfaction:{' '}
                  <span className="text-cyan-400 font-semibold">
                    {data.careerSatisfaction}/10
                  </span>
                </Label>
                <input
                  type="range"
                  className="w-full accent-cyan-500"
                  min={1}
                  max={10}
                  step={1}
                  value={data.careerSatisfaction}
                  onChange={set('careerSatisfaction')}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Hate it</span>
                  <span>Love it</span>
                </div>
              </div>
              <div>
                <Label>Career goals</Label>
                <textarea
                  className={textareaClass()}
                  rows={3}
                  placeholder="e.g. Start my own business, get promoted to VP, change careers to UX design..."
                  value={data.careerGoals}
                  onChange={set('careerGoals')}
                />
              </div>
            </div>
          )}

          {/* Step 5: Finances */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label>Annual income (approximate)</Label>
                <select
                  className={selectClass()}
                  value={data.annualIncome}
                  onChange={set('annualIncome')}
                >
                  <option value="">Select range...</option>
                  <option value="under $30k">Under $30,000</option>
                  <option value="$30k–$60k">$30,000 – $60,000</option>
                  <option value="$60k–$100k">$60,000 – $100,000</option>
                  <option value="$100k–$150k">$100,000 – $150,000</option>
                  <option value="$150k–$250k">$150,000 – $250,000</option>
                  <option value="$250k–$500k">$250,000 – $500,000</option>
                  <option value="$500k+">$500,000+</option>
                </select>
              </div>
              <div>
                <Label>Current net worth (approximate)</Label>
                <select
                  className={selectClass()}
                  value={data.netWorth}
                  onChange={set('netWorth')}
                >
                  <option value="">Select range...</option>
                  <option value="negative (debt)">Negative (in debt)</option>
                  <option value="$0–$10k">$0 – $10,000</option>
                  <option value="$10k–$50k">$10,000 – $50,000</option>
                  <option value="$50k–$200k">$50,000 – $200,000</option>
                  <option value="$200k–$500k">$200,000 – $500,000</option>
                  <option value="$500k–$1M">$500,000 – $1,000,000</option>
                  <option value="$1M–$5M">$1,000,000 – $5,000,000</option>
                  <option value="$5M+">$5,000,000+</option>
                </select>
              </div>
              <div>
                <Label>How much can you currently save/invest per month? (USD)</Label>
                <input
                  type="number"
                  className={inputClass()}
                  placeholder="e.g. 300"
                  value={data.monthlySavings}
                  onChange={set('monthlySavings')}
                  min={0}
                />
              </div>
              <div>
                <Label>Financial goals</Label>
                <textarea
                  className={textareaClass()}
                  rows={3}
                  placeholder="e.g. Pay off $40k in debt, save 6-month emergency fund, invest for retirement, buy a house..."
                  value={data.financialGoals}
                  onChange={set('financialGoals')}
                />
              </div>
              <div>
                <Label>Biggest financial challenges</Label>
                <textarea
                  className={textareaClass()}
                  rows={3}
                  placeholder="e.g. Living paycheck to paycheck, don't know how to invest, high student loan debt..."
                  value={data.financialChallenges}
                  onChange={set('financialChallenges')}
                />
              </div>
            </div>
          )}

          {/* Step 6: Life Goals */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <Label>What does "happy" look like to you?</Label>
                <textarea
                  className={textareaClass()}
                  rows={3}
                  placeholder="e.g. Financial freedom, strong relationships, meaningful work, time for family..."
                  value={data.happinessDefinition}
                  onChange={set('happinessDefinition')}
                />
              </div>
              <div>
                <Label>1-year goals (where do you want to be in 12 months?)</Label>
                <textarea
                  className={textareaClass()}
                  rows={3}
                  placeholder="e.g. Lose 30 lbs, get a promotion, save $10k, start a side business..."
                  value={data.shortTermGoals}
                  onChange={set('shortTermGoals')}
                />
              </div>
              <div>
                <Label>5+ year goals (your bigger vision)</Label>
                <textarea
                  className={textareaClass()}
                  rows={3}
                  placeholder="e.g. Own a business, retire early, travel the world, be debt free..."
                  value={data.longTermGoals}
                  onChange={set('longTermGoals')}
                />
              </div>
              <div>
                <Label>What is your biggest obstacle right now?</Label>
                <textarea
                  className={textareaClass()}
                  rows={3}
                  placeholder="e.g. Lack of motivation, not knowing where to start, fear of failure, time constraints..."
                  value={data.biggestObstacle}
                  onChange={set('biggestObstacle')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition rounded-lg hover:bg-slate-700 font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-100"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {submitting ? 'Creating...' : 'Generate My Strategy'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
