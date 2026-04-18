import { FileText, Search, Download, Trash2, AlignLeft, FileType, Check, ArrowRight, ArrowLeft, Sparkles, Scale, UserPlus, Calendar, CheckCircle, XCircle, Lock, Crown, Upload, Zap } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { documentsApi, chatApi } from '../lib/api';
import { useCountry } from '../providers/CountryProvider';
import { useTranslation } from 'src/providers/TranslationProvider';

const Motion = motion;

// Map jurisdiction dropdown values to country codes
const JURISDICTION_TO_COUNTRY: Record<string, string> = {
  'United States (Delaware)': 'US',
  'United States (New York)': 'US',
  'United Kingdom': 'UK',
  'European Union': 'EU',
  'Georgia': 'GE',
  'საქართველო': 'GE',
};

const CLAIM_FORMS = (lang: 'EN' | 'GE' | 'RU') => [
  // სამოქალაქო / Civil
  { id: 'civil_claim', title: lang === 'EN' ? 'Civil Claim' : 'სამოქალაქო სარჩელი', category: lang === 'EN' ? 'Civil' : 'სამოქალაქო', desc: lang === 'EN' ? 'Initial lawsuit filing in civil court.' : 'სამოქალაქო სასამართლოში სარჩელის აღძვრა.' },
  { id: 'civil_response', title: lang === 'EN' ? 'Response to Claim' : 'შესაგებელი', category: lang === 'EN' ? 'Civil' : 'სამოქალაქო', desc: lang === 'EN' ? 'Formal response to a civil lawsuit.' : 'სამოქალაქო სარჩელზე პასუხი.' },
  { id: 'civil_appeal', title: lang === 'EN' ? 'Appeal' : 'სააპელაციო საჩივარი', category: lang === 'EN' ? 'Civil' : 'სამოქალაქო', desc: lang === 'EN' ? 'Appeal against first instance court decision.' : 'პირველი ინსტანციის სასამართლოს გადაწყვეტილების გასაჩივრება.' },
  { id: 'civil_appeal_response', title: lang === 'EN' ? 'Appeal Response' : 'სააპელაციო შესაგებელი', category: lang === 'EN' ? 'Civil' : 'სამოქალაქო', desc: lang === 'EN' ? 'Response to an appellate complaint.' : 'სააპელაციო საჩივარზე პასუხი.' },
  { id: 'civil_cassation', title: lang === 'EN' ? 'Cassation Complaint' : 'საკასაციო საჩივარი', category: lang === 'EN' ? 'Civil' : 'სამოქალაქო', desc: lang === 'EN' ? 'Cassation appeal to the Supreme Court.' : 'უზენაეს სასამართლოში საკასაციო საჩივრის შეტანა.' },
  { id: 'civil_cassation_response', title: lang === 'EN' ? 'Cassation Response' : 'საკასაციო შესაგებელი', category: lang === 'EN' ? 'Civil' : 'სამოქალაქო', desc: lang === 'EN' ? 'Response to a cassation complaint.' : 'საკასაციო საჩივარზე პასუხი.' },
  // ადმინისტრაციული / Administrative
  { id: 'admin_claim', title: lang === 'EN' ? 'Administrative Claim' : 'ადმინისტრაციული სარჩელი', category: lang === 'EN' ? 'Administrative' : 'ადმინისტრაციული', desc: lang === 'EN' ? 'Lawsuit against a government body or official.' : 'ადმინისტრაციული ორგანოს ან თანამდებობის პირის წინააღმდეგ სარჩელი.' },
  { id: 'admin_response', title: lang === 'EN' ? 'Administrative Response' : 'ადმინისტრაციული შესაგებელი', category: lang === 'EN' ? 'Administrative' : 'ადმინისტრაციული', desc: lang === 'EN' ? 'Response to an administrative lawsuit.' : 'ადმინისტრაციულ სარჩელზე პასუხი.' },
  { id: 'admin_appeal', title: lang === 'EN' ? 'Administrative Appeal' : 'ადმინისტრაციული სააპელაციო საჩივარი', category: lang === 'EN' ? 'Administrative' : 'ადმინისტრაციული', desc: lang === 'EN' ? 'Appeal in administrative proceedings.' : 'ადმინისტრაციულ საქმეზე სააპელაციო საჩივარი.' },
  { id: 'admin_appeal_response', title: lang === 'EN' ? 'Administrative Appeal Response' : 'ადმინისტრაციული სააპელაციო შესაგებელი', category: lang === 'EN' ? 'Administrative' : 'ადმინისტრაციული', desc: lang === 'EN' ? 'Response to administrative appeal.' : 'ადმინისტრაციულ სააპელაციო საჩივარზე პასუხი.' },
  { id: 'admin_cassation', title: lang === 'EN' ? 'Administrative Cassation' : 'ადმინისტრაციული საკასაციო საჩივარი', category: lang === 'EN' ? 'Administrative' : 'ადმინისტრაციული', desc: lang === 'EN' ? 'Cassation appeal in administrative case.' : 'ადმინისტრაციულ საქმეზე საკასაციო საჩივარი.' },
  { id: 'admin_cassation_response', title: lang === 'EN' ? 'Administrative Cassation Response' : 'ადმინისტრაციული საკასაციო შესაგებელი', category: lang === 'EN' ? 'Administrative' : 'ადმინისტრაციული', desc: lang === 'EN' ? 'Response to administrative cassation complaint.' : 'ადმინისტრაციულ საკასაციო საჩივარზე პასუხი.' },
];

const COURT_OPTIONS = (lang: 'EN' | 'GE' | 'RU') => [
  { value: 'district', label: lang === 'EN' ? 'District Court' : 'რაიონული (საქალაქო) სასამართლო' },
  { value: 'appellate', label: lang === 'EN' ? 'Court of Appeals' : 'სააპელაციო სასამართლო' },
  { value: 'supreme', label: lang === 'EN' ? 'Supreme Court' : 'საქართველოს უზენაესი სასამართლო' },
];

// hcoj.gov.ge ოფიციალური ფორმების ველები — ყოველ ფორმას სხვადასხვა ველები აქვს
type ClaimFieldKey = 'court' | 'plaintiff' | 'plaintiffId' | 'plaintiffAddress' | 'plaintiffPhone' | 'plaintiffEmail' | 'defendant' | 'defendantId' | 'defendantAddress' | 'defendantPhone' | 'amount' | 'claimSubject' | 'basis' | 'demand' | 'evidence' | 'caseNumber' | 'contestedDecision' | 'contestedDecisionDate' | 'appealGrounds' | 'representative' | 'representativeId' | 'representativeAddress' | 'representativePhone' | 'adminBody' | 'adminAct';

interface ClaimField {
  key: ClaimFieldKey;
  type: 'text' | 'textarea' | 'select';
  required?: boolean;
}

const CLAIM_FORM_FIELDS: Record<string, ClaimFieldKey[]> = {
  // სარჩელის ფორმა — hcoj.gov.ge სრული ველები
  civil_claim: ['court', 'plaintiff', 'plaintiffId', 'plaintiffAddress', 'plaintiffPhone', 'plaintiffEmail', 'representative', 'representativeId', 'representativeAddress', 'representativePhone', 'defendant', 'defendantId', 'defendantAddress', 'defendantPhone', 'claimSubject', 'amount', 'basis', 'demand', 'evidence'],
  admin_claim: ['court', 'plaintiff', 'plaintiffId', 'plaintiffAddress', 'plaintiffPhone', 'plaintiffEmail', 'representative', 'representativeId', 'representativeAddress', 'representativePhone', 'adminBody', 'adminAct', 'claimSubject', 'basis', 'demand', 'evidence'],
  // შესაგებლის ფორმა
  civil_response: ['court', 'caseNumber', 'defendant', 'defendantId', 'defendantAddress', 'defendantPhone', 'representative', 'representativeId', 'representativeAddress', 'representativePhone', 'plaintiff', 'basis', 'demand', 'evidence'],
  admin_response: ['court', 'caseNumber', 'defendant', 'defendantId', 'defendantAddress', 'defendantPhone', 'representative', 'representativeId', 'representativeAddress', 'representativePhone', 'adminBody', 'plaintiff', 'basis', 'demand', 'evidence'],
  // სააპელაციო საჩივრის ფორმა
  civil_appeal: ['court', 'caseNumber', 'plaintiff', 'plaintiffId', 'plaintiffAddress', 'plaintiffPhone', 'plaintiffEmail', 'representative', 'representativeId', 'representativeAddress', 'representativePhone', 'defendant', 'defendantId', 'defendantAddress', 'contestedDecision', 'contestedDecisionDate', 'appealGrounds', 'demand', 'evidence'],
  admin_appeal: ['court', 'caseNumber', 'plaintiff', 'plaintiffId', 'plaintiffAddress', 'plaintiffPhone', 'plaintiffEmail', 'representative', 'representativeId', 'representativeAddress', 'representativePhone', 'adminBody', 'contestedDecision', 'contestedDecisionDate', 'appealGrounds', 'demand', 'evidence'],
  // სააპელაციო შესაგებლის ფორმა
  civil_appeal_response: ['court', 'caseNumber', 'defendant', 'defendantId', 'defendantAddress', 'defendantPhone', 'representative', 'representativeId', 'representativeAddress', 'representativePhone', 'plaintiff', 'contestedDecision', 'basis', 'demand', 'evidence'],
  admin_appeal_response: ['court', 'caseNumber', 'defendant', 'defendantId', 'defendantAddress', 'defendantPhone', 'representative', 'representativeId', 'representativeAddress', 'representativePhone', 'adminBody', 'plaintiff', 'contestedDecision', 'basis', 'demand', 'evidence'],
  // საკასაციო საჩივრის ფორმა
  civil_cassation: ['court', 'caseNumber', 'plaintiff', 'plaintiffId', 'plaintiffAddress', 'plaintiffPhone', 'plaintiffEmail', 'representative', 'representativeId', 'representativeAddress', 'representativePhone', 'defendant', 'defendantId', 'defendantAddress', 'contestedDecision', 'contestedDecisionDate', 'appealGrounds', 'demand', 'evidence'],
  admin_cassation: ['court', 'caseNumber', 'plaintiff', 'plaintiffId', 'plaintiffAddress', 'plaintiffPhone', 'plaintiffEmail', 'representative', 'representativeId', 'representativeAddress', 'representativePhone', 'adminBody', 'contestedDecision', 'contestedDecisionDate', 'appealGrounds', 'demand', 'evidence'],
  // საკასაციო შესაგებლის ფორმა
  civil_cassation_response: ['court', 'caseNumber', 'defendant', 'defendantId', 'defendantAddress', 'defendantPhone', 'representative', 'representativeId', 'representativeAddress', 'representativePhone', 'plaintiff', 'contestedDecision', 'basis', 'demand', 'evidence'],
  admin_cassation_response: ['court', 'caseNumber', 'defendant', 'defendantId', 'defendantAddress', 'defendantPhone', 'representative', 'representativeId', 'representativeAddress', 'representativePhone', 'adminBody', 'plaintiff', 'contestedDecision', 'basis', 'demand', 'evidence'],
};

// ოფიციალური სასამართლო ფორმების შაბლონები — hcoj.gov.ge სტრუქტურა
// AI-ს ეგზავნება უკვე შევსებული ფორმა, მხოლოდ სამართლებრივი ნაწილის დამატება სჭირდება
function buildClaimFormText(
  formId: string,
  d: Record<string, string>,
  formTitle: string
): string {
  const B = '_________________'; // blank
  const v = (key: string) => d[key]?.trim() || B;
  const isAdmin = formId.includes('admin');
  const category = isAdmin ? 'ადმინისტრაციულ' : 'სამოქალაქო';

  // სასამართლოს მიმართვა
  let form = `${v('court')} სასამართლოს ${category} საქმეთა კოლეგიას\n\n`;

  // საქმის ნომერი (შესაგებელი, აპელაცია, კასაცია)
  if (d.caseNumber?.trim()) {
    form += `საქმის ნომერი: ${v('caseNumber')}\n\n`;
  }

  // მოსარჩელე / აპელანტი / კასატორი
  const isResponse = formId.includes('response');
  if (!isResponse) {
    form += `მოსარჩელე:\n`;
    form += `${v('plaintiff')}\n`;
    form += `პირადი ნომერი/ს/კ: ${v('plaintiffId')}\n`;
    form += `მისამართი: ${v('plaintiffAddress')}\n`;
    form += `ტელეფონი: ${v('plaintiffPhone')}\n`;
    if (d.plaintiffEmail?.trim()) form += `ელ.ფოსტა: ${v('plaintiffEmail')}\n`;
    form += '\n';
  }

  // წარმომადგენელი
  if (d.representative?.trim()) {
    form += `წარმომადგენელი:\n`;
    form += `${v('representative')}\n`;
    if (d.representativeId?.trim()) form += `პირადი ნომერი: ${v('representativeId')}\n`;
    if (d.representativeAddress?.trim()) form += `მისამართი: ${v('representativeAddress')}\n`;
    if (d.representativePhone?.trim()) form += `ტელეფონი: ${v('representativePhone')}\n`;
    form += '\n';
  }

  // მოპასუხე
  if (isAdmin) {
    if (d.adminBody?.trim()) {
      form += `მოპასუხე (ადმინისტრაციული ორგანო):\n`;
      form += `${v('adminBody')}\n`;
      if (d.adminAct?.trim()) form += `გასაჩივრებული აქტი: ${v('adminAct')}\n`;
      form += '\n';
    }
  } else {
    form += `მოპასუხე:\n`;
    form += `${v('defendant')}\n`;
    form += `პირადი ნომერი/ს/კ: ${v('defendantId')}\n`;
    form += `მისამართი: ${v('defendantAddress')}\n`;
    if (d.defendantPhone?.trim()) form += `ტელეფონი: ${v('defendantPhone')}\n`;
    form += '\n';
  }

  // შესაგებლისთვის — მოსარჩელე ბოლოს
  if (isResponse && d.plaintiff?.trim()) {
    form += `მოსარჩელე: ${v('plaintiff')}\n\n`;
  }

  // გასაჩივრებული გადაწყვეტილება (აპელაცია/კასაცია)
  if (d.contestedDecision?.trim()) {
    form += `გასაჩივრებული გადაწყვეტილება: ${v('contestedDecision')}\n`;
    if (d.contestedDecisionDate?.trim()) form += `გადაწყვეტილების თარიღი: ${v('contestedDecisionDate')}\n`;
    form += '\n';
  }

  // სარჩელის საგანი და ფასი
  if (d.claimSubject?.trim()) form += `სასარჩელო მოთხოვნის საგანი: ${v('claimSubject')}\n\n`;
  if (d.amount?.trim()) form += `სარჩელის ფასი: ${v('amount')} ლარი\n\n`;

  // გასაჩივრების საფუძვლები (აპელაცია/კასაცია)
  if (d.appealGrounds?.trim()) {
    form += `გასაჩივრების საფუძვლები:\n${v('appealGrounds')}\n\n`;
  }

  // ფაქტობრივი გარემოებები
  form += `ფაქტობრივი გარემოებები:\n`;
  form += `${d.basis?.trim() || '[მომხმარებელმა არ მიუთითა — AI-მ არ უნდა მოიგონოს]'}\n\n`;

  // სამართლებრივი საფუძვლები — AI ავსებს
  form += `სამართლებრივი საფუძვლები:\n[AI ავსებს — მხოლოდ კანონის/კოდექსის სახელი და მუხლის ნომერი]\n\n`;

  // მოთხოვნა
  form += `მოთხოვნა:\n`;
  form += `${d.demand?.trim() || B}\n\n`;

  // მტკიცებულებები
  form += `მტკიცებულებათა ჩამონათვალი:\n`;
  form += `${d.evidence?.trim() || B}\n\n`;

  // თანდართული დოკუმენტები — AI ავსებს
  form += `თანდართული დოკუმენტები:\n[AI ავსებს — სტანდარტული დანართების სია ამ ტიპის სარჩელისთვის]\n\n`;

  // სახელმწიფო ბაჟი — AI ითვლის
  form += `სახელმწიფო ბაჟის ოდენობა: [AI ითვლის სარჩელის ფასის მიხედვით]\n\n`;

  // თარიღი
  const today = new Date().toLocaleDateString('ka-GE', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
  form += `თარიღი: ${today}`;

  return form;
}

function buildClaimPrompt(
  form: { id: string; title: string },
  details: Record<string, string>,
  _language: 'EN' | 'GE' | 'RU',
  hasAttachedFile: boolean
): string {
  // AI-ს ეგზავნება მხოლოდ ის მონაცემები რაც უნდა დაამუშაოს.
  // მომხმარებლის პერსონალური მონაცემები (სახელები, პ/ნ, მისამართები) არ იგზავნება.
  const isAdmin = form.id.includes('admin');

  let prompt = `სარჩელის ტიპი: ${form.title}\n`;
  prompt += `კატეგორია: ${isAdmin ? 'ადმინისტრაციული' : 'სამოქალაქო'}\n`;

  if (details.claimSubject?.trim()) prompt += `სასარჩელო მოთხოვნის საგანი: ${details.claimSubject.trim()}\n`;
  if (details.amount?.trim()) prompt += `სარჩელის ფასი: ${details.amount.trim()} ლარი\n`;

  prompt += `\nფაქტობრივი გარემოებები (მომხმარებლის ტექსტი):\n${details.basis?.trim() || 'არ არის მითითებული'}\n`;
  prompt += `\nმოთხოვნა:\n${details.demand?.trim() || 'არ არის მითითებული'}\n`;

  if (details.evidence?.trim()) {
    prompt += `\nმტკიცებულებები:\n${details.evidence.trim()}\n`;
  }
  if (details.appealGrounds?.trim()) {
    prompt += `\nგასაჩივრების საფუძვლები:\n${details.appealGrounds.trim()}\n`;
  }

  if (hasAttachedFile) {
    prompt += '\nთანდართულ ფაილში მოცემულია დამატებითი დოკუმენტი — გაანალიზე და გამოიყენე ფაქტობრივ გარემოებებში.\n';
  }

  prompt += `\nდააბრუნე მხოლოდ JSON:
{
  "facts": "ფაქტობრივი გარემოებები ფორმალურ იურიდიულ ქართულ ენაზე",
  "legalGrounds": ["საქართველოს სამოქალაქო კოდექსის XXX-ე მუხლი"],
  "stateFee": "თანხა ციფრებით და სიტყვიერად",
  "attachments": ["დოკუმენტი 1", "დოკუმენტი 2"],
  "disputeType": "obligations|civil_rights|entrepreneurial|labor|intellectual_property|personal_non_property|family",
  "jurisdiction": "defendant_residence|defendant_property|contract_performance|plaintiff_residence|child_residence|immovable_property|heir_last_residence"
}`;

  return prompt;
}

/** AI-ს JSON პასუხიდან ამოღებული მონაცემების ტიპი */
interface ClaimAIResult {
  facts: string;
  legalGrounds: string[];
  stateFee: string;
  attachments: string[];
  disputeType?: string;
  jurisdiction?: string;
}

/** AI-ს პასუხიდან JSON-ის ამოღება (code fence stripping + fallback) */
function parseClaimAIResponse(raw: string): ClaimAIResult {
  let text = raw.trim();
  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  try {
    return JSON.parse(text);
  } catch {
    // Fallback: extract first {...} block
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('AI-ს პასუხი JSON ფორმატში არ არის. გთხოვთ სცადოთ ხელახლა.');
  }
}

/** საბოლოო დოკუმენტის აწყობა: მომხმარებლის მონაცემები + AI-ს სექციები */
function assembleClaimDocument(
  formId: string,
  details: Record<string, string>,
  formTitle: string,
  aiResult: ClaimAIResult
): string {
  // ფორმის template მომხმარებლის მონაცემებით (სახელები, პ/ნ, მისამართები — კოდიდან)
  let doc = buildClaimFormText(formId, details, formTitle);

  // AI-ს სექციების ჩასმა მარკერების ადგილას
  const legalText = Array.isArray(aiResult.legalGrounds)
    ? aiResult.legalGrounds.join('\n')
    : String(aiResult.legalGrounds || '');
  doc = doc.replace(
    '[AI ავსებს — მხოლოდ კანონის/კოდექსის სახელი და მუხლის ნომერი]',
    legalText || 'გამოსათვლელია'
  );

  const attachText = Array.isArray(aiResult.attachments)
    ? aiResult.attachments.map((a, i) => `${i + 1}. ${a}`).join('\n')
    : String(aiResult.attachments || '');
  doc = doc.replace(
    '[AI ავსებს — სტანდარტული დანართების სია ამ ტიპის სარჩელისთვის]',
    attachText || '1. მოსარჩელის პირადობის მოწმობის ასლი\n2. სახელმწიფო ბაჟის გადახდის ქვითარი'
  );

  doc = doc.replace(
    '[AI ითვლის სარჩელის ფასის მიხედვით]',
    aiResult.stateFee || 'გამოსათვლელია'
  );

  // ფაქტობრივი გარემოებების ფორმალიზებული ვერსია
  if (aiResult.facts?.trim()) {
    const userBasis = details.basis?.trim() || '[მომხმარებელმა არ მიუთითა — AI-მ არ უნდა მოიგონოს]';
    doc = doc.replace(userBasis, aiResult.facts.trim());
  }

  return doc;
}

const TEMPLATES = (lang: 'EN' | 'GE' | 'RU') => [
  // Contracts
  { id: 'nda', title: lang === 'EN' ? 'Non-Disclosure Agreement' : 'კონფიდენციალურობის შეთანხმება', category: lang === 'EN' ? 'Corporate' : 'კორპორატიული', desc: lang === 'EN' ? 'Standard mutual or one-way confidentiality agreement.' : 'სტანდარტული ორმხრივი ან ცალმხრივი შეთანხმება.' },
  { id: 'service', title: lang === 'EN' ? 'Service Agreement' : 'მომსახურების ხელშეკრულება', category: lang === 'EN' ? 'Contracts' : 'ხელშეკრულებები', desc: lang === 'EN' ? 'Standard service provision agreement.' : 'მომსახურების გაწევის სტანდარტული ხელშეკრულება.' },
  { id: 'sales', title: lang === 'EN' ? 'Sales Contract' : 'ნასყიდობის ხელშეკრულება', category: lang === 'EN' ? 'Contracts' : 'ხელშეკრულებები', desc: lang === 'EN' ? 'Property or goods purchase agreement.' : 'ქონების ან საქონლის ნასყიდობის ხელშეკრულება.' },
  { id: 'loan', title: lang === 'EN' ? 'Loan Agreement' : 'სესხის ხელშეკრულება', category: lang === 'EN' ? 'Finance' : 'ფინანსები', desc: lang === 'EN' ? 'Agreement for lending or borrowing funds.' : 'თანხის სესხად აღების ხელშეკრულება.' },
  { id: 'saas', title: lang === 'EN' ? 'SaaS Service Agreement' : 'SaaS მომსახურების ხელშეკრულება', category: lang === 'EN' ? 'Technology' : 'ტექნოლოგიები', desc: lang === 'EN' ? 'Cloud software license and service level agreement.' : 'ღრუბლოვანი პროგრამული უზრუნველყოფის ლიცენზია.' },
  { id: 'consulting', title: lang === 'EN' ? 'Consulting Agreement' : 'საკონსულტაციო ხელშეკრულება', category: lang === 'EN' ? 'Contracts' : 'ხელშეკრულებები', desc: lang === 'EN' ? 'Professional consulting services engagement.' : 'პროფესიონალური საკონსულტაციო მომსახურების ხელშეკრულება.' },
  { id: 'contractor', title: lang === 'EN' ? 'Independent Contractor Agreement' : 'დამოუკიდებელი კონტრაქტორის ხელშეკრულება', category: lang === 'EN' ? 'Contracts' : 'ხელშეკრულებები', desc: lang === 'EN' ? 'Freelancer or independent contractor engagement terms.' : 'ფრილანსერის ან დამოუკიდებელი კონტრაქტორის პირობები.' },
  { id: 'supply', title: lang === 'EN' ? 'Supply Agreement' : 'მიწოდების ხელშეკრულება', category: lang === 'EN' ? 'Contracts' : 'ხელშეკრულებები', desc: lang === 'EN' ? 'Goods or materials supply contract.' : 'საქონლის ან მასალების მიწოდების ხელშეკრულება.' },
  { id: 'distribution', title: lang === 'EN' ? 'Distribution Agreement' : 'დისტრიბუციის ხელშეკრულება', category: lang === 'EN' ? 'Contracts' : 'ხელშეკრულებები', desc: lang === 'EN' ? 'Product distribution and reseller agreement.' : 'პროდუქციის დისტრიბუციისა და გადაყიდვის ხელშეკრულება.' },
  { id: 'franchise', title: lang === 'EN' ? 'Franchise Agreement' : 'ფრანჩაიზინგის ხელშეკრულება', category: lang === 'EN' ? 'Contracts' : 'ხელშეკრულებები', desc: lang === 'EN' ? 'Franchise rights and obligations agreement.' : 'ფრანჩაიზინგის უფლებებისა და ვალდებულებების ხელშეკრულება.' },
  { id: 'joint_venture', title: lang === 'EN' ? 'Joint Venture Agreement' : 'ერთობლივი საქმიანობის ხელშეკრულება', category: lang === 'EN' ? 'Corporate' : 'კორპორატიული', desc: lang === 'EN' ? 'Agreement for joint business undertaking between parties.' : 'მხარეთა ერთობლივი ბიზნეს საქმიანობის შეთანხმება.' },
  { id: 'construction', title: lang === 'EN' ? 'Construction Contract' : 'სამშენებლო ხელშეკრულება', category: lang === 'EN' ? 'Contracts' : 'ხელშეკრულებები', desc: lang === 'EN' ? 'Building or renovation project agreement.' : 'მშენებლობის ან რემონტის პროექტის ხელშეკრულება.' },
  { id: 'agency', title: lang === 'EN' ? 'Agency Agreement' : 'სააგენტო ხელშეკრულება', category: lang === 'EN' ? 'Contracts' : 'ხელშეკრულებები', desc: lang === 'EN' ? 'Agreement appointing an agent to act on behalf of a principal.' : 'აგენტის დანიშვნის ხელშეკრულება პრინციპალის სახელით მოქმედებისთვის.' },
  { id: 'commission', title: lang === 'EN' ? 'Commission Agreement' : 'საკომისიო ხელშეკრულება', category: lang === 'EN' ? 'Contracts' : 'ხელშეკრულებები', desc: lang === 'EN' ? 'Agreement for commission-based compensation.' : 'საკომისიო ანაზღაურების ხელშეკრულება.' },
  // Employment / HR
  { id: 'employment', title: lang === 'EN' ? 'Employment Contract' : 'შრომითი ხელშეკრულება', category: lang === 'EN' ? 'HR' : 'HR', desc: lang === 'EN' ? 'Standard full-time employment agreement with IP clauses.' : 'სტანდარტული შრომითი ხელშეკრულება IP პირობებით.' },
  { id: 'resignation', title: lang === 'EN' ? 'Resignation Letter' : 'სამსახურიდან გათავისუფლების განცხადება', category: lang === 'EN' ? 'HR' : 'HR', desc: lang === 'EN' ? 'Formal letter of voluntary resignation.' : 'საკუთარი სურვილით სამსახურიდან წასვლის განცხადება.' },
  { id: 'non_compete', title: lang === 'EN' ? 'Non-Compete Agreement' : 'კონკურენციის აკრძალვის შეთანხმება', category: lang === 'EN' ? 'HR' : 'HR', desc: lang === 'EN' ? 'Restriction on competitive activities after employment.' : 'კონკურენტულ საქმიანობაზე შეზღუდვა დასაქმების შემდეგ.' },
  { id: 'internship', title: lang === 'EN' ? 'Internship Agreement' : 'სტაჟირების ხელშეკრულება', category: lang === 'EN' ? 'HR' : 'HR', desc: lang === 'EN' ? 'Internship terms, duties, and compensation agreement.' : 'სტაჟირების პირობების, მოვალეობებისა და ანაზღაურების ხელშეკრულება.' },
  { id: 'termination_notice', title: lang === 'EN' ? 'Employment Termination Notice' : 'შრომითი ხელშეკრულების შეწყვეტის შეტყობინება', category: lang === 'EN' ? 'HR' : 'HR', desc: lang === 'EN' ? 'Formal notice of employment termination.' : 'შრომითი ხელშეკრულების შეწყვეტის ოფიციალური შეტყობინება.' },
  // Corporate
  { id: 'partnership', title: lang === 'EN' ? 'Partnership Agreement' : 'პარტნიორობის შეთანხმება', category: lang === 'EN' ? 'Corporate' : 'კორპორატიული', desc: lang === 'EN' ? 'Agreement defining rights and duties of business partners.' : 'შეთანხმება ბიზნეს პარტნიორების უფლებებზე.' },
  { id: 'company_charter', title: lang === 'EN' ? 'Company Charter' : 'კომპანიის წესდება', category: lang === 'EN' ? 'Corporate' : 'კორპორატიული', desc: lang === 'EN' ? 'Articles of incorporation for LLC or other entity.' : 'შპს-ს ან სხვა სამართლებრივი ფორმის კომპანიის წესდება.' },
  { id: 'shareholders', title: lang === 'EN' ? 'Shareholders Agreement' : 'პარტნიორთა შეთანხმება', category: lang === 'EN' ? 'Corporate' : 'კორპორატიული', desc: lang === 'EN' ? 'Agreement between company shareholders or partners.' : 'კომპანიის პარტნიორებს/აქციონერებს შორის შეთანხმება.' },
  { id: 'board_resolution', title: lang === 'EN' ? 'Board Resolution' : 'დირექტორთა საბჭოს გადაწყვეტილება', category: lang === 'EN' ? 'Corporate' : 'კორპორატიული', desc: lang === 'EN' ? 'Formal resolution adopted by the board of directors.' : 'დირექტორთა საბჭოს მიერ მიღებული ფორმალური გადაწყვეტილება.' },
  { id: 'meeting_minutes', title: lang === 'EN' ? 'Meeting Minutes' : 'კრების ოქმი', category: lang === 'EN' ? 'Corporate' : 'კორპორატიული', desc: lang === 'EN' ? 'Official record of meeting proceedings and decisions.' : 'კრების მიმდინარეობისა და გადაწყვეტილებების ოფიციალური ჩანაწერი.' },
  { id: 'share_transfer', title: lang === 'EN' ? 'Share Transfer Agreement' : 'წილის გადაცემის ხელშეკრულება', category: lang === 'EN' ? 'Corporate' : 'კორპორატიული', desc: lang === 'EN' ? 'Transfer of company shares or ownership interest.' : 'კომპანიის წილის ან საკუთრების გადაცემის ხელშეკრულება.' },
  { id: 'mou', title: lang === 'EN' ? 'Memorandum of Understanding' : 'ურთიერთგაგების მემორანდუმი', category: lang === 'EN' ? 'Corporate' : 'კორპორატიული', desc: lang === 'EN' ? 'Preliminary agreement outlining intended cooperation.' : 'წინასწარი შეთანხმება დაგეგმილ თანამშრომლობაზე.' },
  { id: 'loi', title: lang === 'EN' ? 'Letter of Intent' : 'განზრახვის წერილი', category: lang === 'EN' ? 'Corporate' : 'კორპორატიული', desc: lang === 'EN' ? 'Declaration of intent to enter into a transaction.' : 'გარიგების დადების განზრახვის დეკლარაცია.' },
  // Real Estate / Property
  { id: 'lease', title: lang === 'EN' ? 'Commercial Lease' : 'კომერციული იჯარა', category: lang === 'EN' ? 'Real Estate' : 'უძრავი ქონება', desc: lang === 'EN' ? 'Standard lease for office or retail space.' : 'სტანდარტული იჯარა ოფისისთვის ან სავაჭრო ფართისთვის.' },
  { id: 'rental', title: lang === 'EN' ? 'Rental Agreement' : 'ქირავნობის ხელშეკრულება', category: lang === 'EN' ? 'Real Estate' : 'უძრავი ქონება', desc: lang === 'EN' ? 'Residential or commercial rental agreement.' : 'უძრავი ან მოძრავი ქონების ქირავნობის ხელშეკრულება.' },
  { id: 'property_deed', title: lang === 'EN' ? 'Property Purchase Agreement' : 'უძრავი ქონების ნასყიდობა', category: lang === 'EN' ? 'Real Estate' : 'უძრავი ქონება', desc: lang === 'EN' ? 'Real estate purchase and sale agreement.' : 'უძრავი ქონების ნასყიდობის ხელშეკრულება.' },
  { id: 'vehicle_sale', title: lang === 'EN' ? 'Vehicle Sale Agreement' : 'ავტომობილის ნასყიდობა', category: lang === 'EN' ? 'Real Estate' : 'უძრავი ქონება', desc: lang === 'EN' ? 'Motor vehicle purchase and sale agreement.' : 'ავტომობილის ნასყიდობის ხელშეკრულება.' },
  { id: 'sublease', title: lang === 'EN' ? 'Sublease Agreement' : 'ქვეიჯარის ხელშეკრულება', category: lang === 'EN' ? 'Real Estate' : 'უძრავი ქონება', desc: lang === 'EN' ? 'Agreement to sublease property to a third party.' : 'ქონების მესამე პირისთვის ქვეიჯარით გადაცემის ხელშეკრულება.' },
  { id: 'property_management', title: lang === 'EN' ? 'Property Management Agreement' : 'ქონების მართვის ხელშეკრულება', category: lang === 'EN' ? 'Real Estate' : 'უძრავი ქონება', desc: lang === 'EN' ? 'Agreement for professional property management services.' : 'ქონების პროფესიონალური მართვის მომსახურების ხელშეკრულება.' },
  // Finance
  { id: 'promissory_note', title: lang === 'EN' ? 'Promissory Note' : 'თამასუქი', category: lang === 'EN' ? 'Finance' : 'ფინანსები', desc: lang === 'EN' ? 'Written promise to pay a specified sum of money.' : 'განსაზღვრული თანხის გადახდის წერილობითი დაპირება.' },
  { id: 'investment', title: lang === 'EN' ? 'Investment Agreement' : 'საინვესტიციო ხელშეკრულება', category: lang === 'EN' ? 'Finance' : 'ფინანსები', desc: lang === 'EN' ? 'Terms and conditions for capital investment.' : 'კაპიტალის ინვესტირების პირობების ხელშეკრულება.' },
  { id: 'pledge', title: lang === 'EN' ? 'Pledge Agreement' : 'გირავნობის ხელშეკრულება', category: lang === 'EN' ? 'Finance' : 'ფინანსები', desc: lang === 'EN' ? 'Agreement pledging assets as collateral for a debt.' : 'აქტივების გირაოდ დადების ხელშეკრულება ვალდებულების უზრუნველსაყოფად.' },
  { id: 'guarantee', title: lang === 'EN' ? 'Guarantee Agreement' : 'თავდებობის ხელშეკრულება', category: lang === 'EN' ? 'Finance' : 'ფინანსები', desc: lang === 'EN' ? 'Third-party guarantee for debt or obligation.' : 'მესამე პირის თავდებობა ვალდებულებაზე.' },
  // Legal
  { id: 'power_of_attorney', title: lang === 'EN' ? 'Power of Attorney' : 'მინდობილობა', category: lang === 'EN' ? 'Legal' : 'სამართლებრივი', desc: lang === 'EN' ? 'Delegation of authority to another person.' : 'სხვა პირისთვის უფლებამოსილების გადაცემა.' },
  { id: 'settlement', title: lang === 'EN' ? 'Settlement Agreement' : 'მორიგების შეთანხმება', category: lang === 'EN' ? 'Legal' : 'სამართლებრივი', desc: lang === 'EN' ? 'Agreement to resolve a dispute without litigation.' : 'დავის სასამართლოს გარეშე მოგვარების შეთანხმება.' },
  { id: 'arbitration', title: lang === 'EN' ? 'Arbitration Agreement' : 'საარბიტრაჟო შეთანხმება', category: lang === 'EN' ? 'Legal' : 'სამართლებრივი', desc: lang === 'EN' ? 'Agreement to resolve disputes through arbitration.' : 'დავების არბიტრაჟის გზით გადაწყვეტის შეთანხმება.' },
  { id: 'indemnity', title: lang === 'EN' ? 'Indemnity Agreement' : 'ანაზღაურების ხელშეკრულება', category: lang === 'EN' ? 'Legal' : 'სამართლებრივი', desc: lang === 'EN' ? 'Agreement to compensate for loss or damage.' : 'ზარალის ან ზიანის ანაზღაურების ხელშეკრულება.' },
  { id: 'release_waiver', title: lang === 'EN' ? 'Release & Waiver' : 'უარყოფა და გათავისუფლება', category: lang === 'EN' ? 'Legal' : 'სამართლებრივი', desc: lang === 'EN' ? 'Release from liability and waiver of claims.' : 'პასუხისმგებლობისგან გათავისუფლება და მოთხოვნაზე უარის თქმა.' },
  { id: 'complaint', title: lang === 'EN' ? 'Formal Complaint' : 'საჩივარი', category: lang === 'EN' ? 'Legal' : 'სამართლებრივი', desc: lang === 'EN' ? 'Official complaint to an organization or authority.' : 'ოფიციალური საჩივარი ორგანიზაციის ან უწყებისთვის.' },
  { id: 'claim_statement', title: lang === 'EN' ? 'Statement of Claim' : 'სარჩელი', category: lang === 'EN' ? 'Legal' : 'სამართლებრივი', desc: lang === 'EN' ? 'Formal claim filed with a court or tribunal.' : 'სასამართლოში შესატანი ფორმალური სარჩელი.' },
  { id: 'appeal', title: lang === 'EN' ? 'Appeal Letter' : 'სააპელაციო საჩივარი', category: lang === 'EN' ? 'Legal' : 'სამართლებრივი', desc: lang === 'EN' ? 'Formal appeal against a decision or ruling.' : 'გადაწყვეტილების გასაჩივრების ფორმალური სააპელაციო საჩივარი.' },
  // Compliance / Privacy
  { id: 'privacy', title: lang === 'EN' ? 'Privacy Policy' : 'კონფიდენციალურობის პოლიტიკა', category: lang === 'EN' ? 'Compliance' : 'შესაბამისობა', desc: lang === 'EN' ? 'GDPR and CCPA compliant privacy disclosure.' : 'GDPR და CCPA შესაბამისი დოკუმენტი.' },
  { id: 'terms_of_service', title: lang === 'EN' ? 'Terms of Service' : 'მომსახურების პირობები', category: lang === 'EN' ? 'Compliance' : 'შესაბამისობა', desc: lang === 'EN' ? 'Website or application terms of use.' : 'ვებგვერდის ან აპლიკაციის გამოყენების პირობები.' },
  { id: 'cookie_policy', title: lang === 'EN' ? 'Cookie Policy' : 'ქუქი-ფაილების პოლიტიკა', category: lang === 'EN' ? 'Compliance' : 'შესაბამისობა', desc: lang === 'EN' ? 'Cookie usage disclosure for websites.' : 'ვებგვერდის ქუქი-ფაილების გამოყენების პოლიტიკა.' },
  { id: 'dpa', title: lang === 'EN' ? 'Data Processing Agreement' : 'მონაცემთა დამუშავების ხელშეკრულება', category: lang === 'EN' ? 'Compliance' : 'შესაბამისობა', desc: lang === 'EN' ? 'GDPR-compliant data processing agreement.' : 'GDPR-თან შესაბამისი მონაცემთა დამუშავების ხელშეკრულება.' },
  // Intellectual Property
  { id: 'license', title: lang === 'EN' ? 'License Agreement' : 'ლიცენზიის ხელშეკრულება', category: lang === 'EN' ? 'IP' : 'ინტელექტუალური საკუთრება', desc: lang === 'EN' ? 'Grant of rights to use intellectual property.' : 'ინტელექტუალური საკუთრების გამოყენების უფლების მინიჭება.' },
  { id: 'trademark_assignment', title: lang === 'EN' ? 'Trademark Assignment' : 'სასაქონლო ნიშნის გადაცემა', category: lang === 'EN' ? 'IP' : 'ინტელექტუალური საკუთრება', desc: lang === 'EN' ? 'Transfer of trademark ownership rights.' : 'სასაქონლო ნიშანზე საკუთრების უფლების გადაცემა.' },
  { id: 'copyright_license', title: lang === 'EN' ? 'Copyright License Agreement' : 'საავტორო უფლების ლიცენზია', category: lang === 'EN' ? 'IP' : 'ინტელექტუალური საკუთრება', desc: lang === 'EN' ? 'License to use copyrighted material.' : 'საავტორო უფლებით დაცული მასალის გამოყენების ლიცენზია.' },
  { id: 'ip_assignment', title: lang === 'EN' ? 'IP Assignment Agreement' : 'ინტელექტუალური საკუთრების გადაცემა', category: lang === 'EN' ? 'IP' : 'ინტელექტუალური საკუთრება', desc: lang === 'EN' ? 'Transfer of intellectual property rights.' : 'ინტელექტუალური საკუთრების უფლებების გადაცემის ხელშეკრულება.' },
  // Family
  { id: 'prenuptial', title: lang === 'EN' ? 'Prenuptial Agreement' : 'საქორწინო კონტრაქტი', category: lang === 'EN' ? 'Family' : 'საოჯახო', desc: lang === 'EN' ? 'Marital property rights agreement.' : 'მეუღლეთა შორის ქონებრივი ურთიერთობის მოწესრიგება.' },
  { id: 'will', title: lang === 'EN' ? 'Last Will & Testament' : 'ანდერძი', category: lang === 'EN' ? 'Family' : 'საოჯახო', desc: lang === 'EN' ? 'Estate distribution and inheritance document.' : 'სამკვიდრო ქონების განაწილების ანდერძი.' },
  { id: 'divorce', title: lang === 'EN' ? 'Divorce Agreement' : 'განქორწინების შეთანხმება', category: lang === 'EN' ? 'Family' : 'საოჯახო', desc: lang === 'EN' ? 'Terms of marital dissolution and property division.' : 'ქორწინების შეწყვეტისა და ქონების გაყოფის პირობები.' },
  { id: 'alimony', title: lang === 'EN' ? 'Alimony Agreement' : 'ალიმენტის შეთანხმება', category: lang === 'EN' ? 'Family' : 'საოჯახო', desc: lang === 'EN' ? 'Agreement for child or spousal support payments.' : 'ბავშვის ან მეუღლის რჩენის თანხის შეთანხმება.' },
  { id: 'gift_deed', title: lang === 'EN' ? 'Gift Deed' : 'ჩუქების ხელშეკრულება', category: lang === 'EN' ? 'Family' : 'საოჯახო', desc: lang === 'EN' ? 'Voluntary transfer of property as a gift.' : 'ქონების უსასყიდლოდ გადაცემის ხელშეკრულება.' },
  // Other
  { id: 'demand_letter', title: lang === 'EN' ? 'Demand Letter' : 'მოთხოვნის წერილი', category: lang === 'EN' ? 'Legal' : 'სამართლებრივი', desc: lang === 'EN' ? 'Formal demand for payment or action.' : 'გადახდის ან მოქმედების ფორმალური მოთხოვნა.' },
  { id: 'reference_letter', title: lang === 'EN' ? 'Reference Letter' : 'სარეკომენდაციო წერილი', category: lang === 'EN' ? 'HR' : 'HR', desc: lang === 'EN' ? 'Professional reference or recommendation letter.' : 'პროფესიონალური სარეკომენდაციო წერილი.' },
  { id: 'affidavit', title: lang === 'EN' ? 'Affidavit' : 'ფიცით დადასტურებული განცხადება', category: lang === 'EN' ? 'Legal' : 'სამართლებრივი', desc: lang === 'EN' ? 'Sworn written statement of facts.' : 'ფაქტების ფიცით დადასტურებული წერილობითი განცხადება.' },
  { id: 'consent_form', title: lang === 'EN' ? 'Consent Form' : 'თანხმობის ფორმა', category: lang === 'EN' ? 'Legal' : 'სამართლებრივი', desc: lang === 'EN' ? 'Formal consent document for various purposes.' : 'ფორმალური თანხმობის დოკუმენტი სხვადასხვა მიზნისთვის.' },
  { id: 'custom', title: lang === 'EN' ? 'Custom Document' : 'სხვა დოკუმენტი', category: lang === 'EN' ? 'Other' : 'სხვა', desc: lang === 'EN' ? 'Describe what kind of document you need.' : 'თავად აღწერეთ რა ტიპის დოკუმენტი გჭირდებათ.' },
];

// Build comprehensive bilingual prompt for AI document generation
function buildDocumentPrompt(
  template: { id: string; title: string },
  details: { partyA: string; partyB: string; jurisdiction: string; effectiveDate: string; customClauses: string },
  language: 'EN' | 'GE' | 'RU',
  countryCode: string
): string {
  if (language === 'GE') {
    return `შექმენი სრული, დეტალური და პროფესიონალური იურიდიული დოკუმენტი შემდეგი მოთხოვნებით:

დოკუმენტის ტიპი: ${template.title}
პირველი მხარე: ${details.partyA || '_________________'}
მეორე მხარე: ${details.partyB || '_________________'}
იურისდიქცია: ${details.jurisdiction}
ძალაში შესვლის თარიღი: ${details.effectiveDate}
${details.customClauses ? `დამატებითი პირობები/ინსტრუქციები: ${details.customClauses}` : ''}

დოკუმენტის სტრუქტურა:

1. სათაური და თარიღი:
   - დოკუმენტის სათაური (დიდი ასოებით ფორმალური დოკუმენტებისთვის)
   - შესრულების ადგილი და თარიღი

2. მხარეების იდენტიფიკაცია (პრეამბულა):
   - თითოეული მხარის სრული მონაცემები: სახელი/გვარი ან საფირმო სახელწოდება, პირადი ნომერი/საიდენტიფიკაციო კოდი, რეგისტრირებული მისამართი, წარმომადგენლის მონაცემები
   - თუ მონაცემები არ არის მოწოდებული, გამოიყენე _________________ (ხაზები)
   - მხარეებს მიანიჭე კონკრეტული როლები (მაგ: გამყიდველი/მყიდველი, დამსაქმებელი/დასაქმებული, მეიჯარე/მოიჯარე)

3. დანომრილი მუხლები (მუხლი 1, მუხლი 2...) — თითოეული მუხლი უნდა შეიცავდეს:
   - მკაფიო სათაურს
   - მრავალ დეტალურ ქვეპუნქტს (1.1, 1.2, 1.3 ან ა), ბ), გ)) რომლებიც მოიცავენ კონკრეტულ პირობებს, გამონაკლისებს და პროცედურებს
   - იყავი შინაარსობრივი: ჩაწერე რეალური სამართლებრივი ვალდებულებები, უფლებები, პირობები, ვადები, ჯარიმები

4. აუცილებელი სექციები (მოარგე დოკუმენტის ტიპს):
   - ხელშეკრულების საგანი და მოქმედების სფერო (დეტალური აღწერა)
   - თითოეული მხარის უფლებები და ვალდებულებები (ცალ-ცალკე, დეტალურად)
   - ფასი/ანაზღაურება და ანგარიშსწორების პირობები (თანხა, გრაფიკი, გადახდის მეთოდი, დაგვიანების ჯარიმა)
   - ვადა/ხანგრძლივობა (დაწყების თარიღი, დასრულების თარიღი, გაგრძელების პირობები, ვადამდე შეწყვეტა)
   - გარანტიები და რეპრეზენტაციები
   - კონფიდენციალურობის ვალდებულებები (თუ შესაბამისია)
   - პასუხისმგებლობა და ზიანის ანაზღაურება (ლიმიტები, გამონაკლისები)
   - ფორს-მაჟორი (მოვლენები, შეტყობინება, შედეგები)
   - დავის გადაწყვეტის წესი (მოლაპარაკება, მედიაცია/არბიტრაჟი/სასამართლო, იურისდიქცია)
   - შეტყობინებების პროცედურა (როგორ იგზავნება ოფიციალური კომუნიკაცია)
   - დასკვნითი დებულებები (განყოფადობა, სრული შეთანხმება, მინიჭება, ენა, ასლების რაოდენობა)

5. ფორმატი:
   - გამოიყენე ქართული ენა ფორმალური იურიდიული ტერმინოლოგიით
   - თითოეული მუხლი ახალი აბზაციდან, 3-8 ქვეპუნქტი მინიმუმ
   - თარიღები ფორმატით: XX.XX.XXXX
   - თანხები ციფრებით და სიტყვიერად (მაგ: 5000 (ხუთი ათასი) ლარი)
   - საქართველოს სამოქალაქო კოდექსის შესაბამისი მუხლების მითითება (თუ შესაბამისია)

6. იურისდიქცია: ${countryCode}

7. მნიშვნელოვანი:
   - არ გამოიყენო Markdown ფორმატირება (არ გამოიყენო **, *, ##, __, ~~)
   - სათაურები და მუხლები დაწერე უბრალო ტექსტით (მაგ: "მუხლი 1. ხელშეკრულების საგანი")
   - არ დაწერო ხელმოწერის ბლოკი - ის ავტომატურად დაემატება

დოკუმენტი უნდა იყოს სრული, დეტალური, პროფესიონალური და მზად ხელმოწერისთვის. არ გამოტოვო არცერთი აუცილებელი სექცია. ყოველი მუხლი უნდა იყოს შინაარსობრივი, არა მხოლოდ სათაური.`;
  }

  return `Generate a COMPLETE, DETAILED, and professional legal document with the following requirements:

Document Type: ${template.title}
First Party: ${details.partyA || '_________________'}
Second Party: ${details.partyB || '_________________'}
Jurisdiction: ${details.jurisdiction}
Effective Date: ${details.effectiveDate}
${details.customClauses ? `Additional Clauses/Instructions: ${details.customClauses}` : ''}

Document Structure:

1. Title and Date:
   - Document title (all caps for formal documents)
   - Place and date of execution

2. Party Identification (Preamble):
   - Full details for each party: legal name, ID/registration number, registered address, representative
   - If details not provided, use _________________ (blanks)
   - Assign specific roles to parties (e.g., Seller/Buyer, Employer/Employee, Lessor/Lessee)

3. Numbered articles (Article 1, Article 2...) — EACH article MUST contain:
   - A clear title describing the subject
   - Multiple detailed sub-clauses (1.1, 1.2, 1.3 or (a), (b), (c)) covering specifics, conditions, exceptions, and procedures
   - Be SUBSTANTIVE: include real legal obligations, rights, conditions, deadlines, penalties — NOT just headings

4. Required Sections (adapt to document type):
   - Subject/Scope of the agreement (detailed description)
   - Rights and Obligations of EACH party (separate sub-sections, detailed)
   - Price/Compensation and Payment terms (amounts, schedule, method, late payment penalties)
   - Term/Duration (start date, end date, renewal conditions, early termination)
   - Representations and Warranties
   - Confidentiality obligations (if applicable)
   - Liability and Indemnification (limits, exclusions)
   - Force Majeure (events, notification, consequences)
   - Dispute Resolution (negotiation, mediation/arbitration/court, jurisdiction, governing law)
   - Notices (how official communications are sent)
   - Final provisions (severability, entire agreement, assignment, language, number of copies)

5. Format:
   - Use formal legal terminology appropriate for ${details.jurisdiction}
   - Each article with 3-8 substantive sub-clauses minimum
   - Dates in standard format for the jurisdiction
   - Amounts in figures and words (e.g., $5,000 (five thousand US dollars))

6. Jurisdiction: ${details.jurisdiction} (${countryCode})

7. Important:
   - Do NOT use Markdown formatting (no **, *, ##, __, ~~)
   - Write headings and sections as plain text (e.g., "Article 1. Subject of Agreement")
   - Do NOT write a signature block — it will be generated automatically

The document must be complete, detailed, professional, and ready for signature. Do not omit any required sections. Every article must be substantive, not just a heading.`;
}

interface LegalDocumentsPageProps {
  onOpenMobileMenu?: () => void;
  language?: 'EN' | 'GE' | 'RU';
  user?: any;
  onOpenUpgrade?: () => void;
}

export function LegalDocumentsPage({ onOpenMobileMenu, language = 'EN', user, onOpenUpgrade }: LegalDocumentsPageProps) {
  const { translate } = useTranslation();
  const { selectedCountry } = useCountry();
  const isPremium = user?.subscription?.is_paid === true;

  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'generate' | 'claims'>('list');
  const [genStep, setGenStep] = useState<'templates' | 'details' | 'generating'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx'>('pdf');
  const [generatedDoc, setGeneratedDoc] = useState<{ id: string; title: string; format: string } | null>(null);
  const [genStatus, setGenStatus] = useState('');
  const [templateCategory, setTemplateCategory] = useState<string>('all');
  const [templateSearch, setTemplateSearch] = useState('');
  const templates = TEMPLATES(language);
  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];
  const filteredTemplates = templates.filter(t => {
    const matchesCategory = templateCategory === 'all' || t.category === templateCategory;
    const matchesSearch = !templateSearch || t.title.toLowerCase().includes(templateSearch.toLowerCase()) || t.desc.toLowerCase().includes(templateSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Claim preparation state
  const claimForms = CLAIM_FORMS(language);
  const claimCategories = ['all', ...Array.from(new Set(claimForms.map(f => f.category)))];
  const [claimStep, setClaimStep] = useState<'form_select' | 'details' | 'generating'>('form_select');
  const [selectedClaimForm, setSelectedClaimForm] = useState<string | null>(null);
  const [claimCategory, setClaimCategory] = useState<string>('all');
  const [claimDetails, setClaimDetails] = useState<Record<string, string>>({
    court: '',
    plaintiff: '',
    plaintiffId: '',
    plaintiffAddress: '',
    plaintiffPhone: '',
    plaintiffEmail: '',
    defendant: '',
    defendantId: '',
    defendantAddress: '',
    defendantPhone: '',
    amount: '',
    claimSubject: '',
    basis: '',
    demand: '',
    evidence: '',
    caseNumber: '',
    contestedDecision: '',
    contestedDecisionDate: '',
    appealGrounds: '',
    representative: '',
    representativeId: '',
    representativeAddress: '',
    representativePhone: '',
    adminBody: '',
    adminAct: '',
  });
  const [claimFileId, setClaimFileId] = useState<string | null>(null);
  const [claimFileName, setClaimFileName] = useState('');
  const [uploadingClaim, setUploadingClaim] = useState(false);
  const claimFileRef = useRef<HTMLInputElement>(null);
  const filteredClaimForms = claimForms.filter(f => claimCategory === 'all' || f.category === claimCategory);

  const defaultJurisdiction = selectedCountry === 'GE' ? 'საქართველო' : 'United States (Delaware)';
  const [details, setDetails] = useState({
    partyA: '',
    partyB: '',
    jurisdiction: defaultJurisdiction,
    effectiveDate: new Date().toISOString().split('T')[0],
    customClauses: ''
  });

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await documentsApi.listDocuments();
      setDocs(Array.isArray(data) ? data : (data.results || []));
    } catch (e) {
      console.error('Failed to fetch documents:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    // Premium check - show upgrade modal for free users
    if (!isPremium) {
      if (onOpenUpgrade) onOpenUpgrade();
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    setGenStep('generating');
    setError(null);
    setGeneratedDoc(null);
    setGenStatus(translate('doc_gen_ai_status', 'Generating document content with AI...'));

    const title = `${template.title} - ${translate('doc_draft_for', 'Draft for')} ${details.partyA || translate('client', 'Client')}`;

    // Determine country code from jurisdiction
    const countryCode = JURISDICTION_TO_COUNTRY[details.jurisdiction] || selectedCountry || 'GE';

    // Build comprehensive prompt
    const prompt = buildDocumentPrompt(template, details, language, countryCode);

    try {
      // Step 1: Generate document content via AI chat (non-streaming)
      setGenStatus(translate('doc_ai_drafting', 'AI is drafting your document...'));

      const chatData = await chatApi.sendMessage({
        message: prompt,
        country_code: countryCode,
        model_tier: 'premium',
        mode: 'document_generation',
      });

      // Strip markdown formatting artifacts from AI output
      const rawContent = chatData?.content || '';
      const documentContent = rawContent
        .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold** → bold
        .replace(/\*(.+?)\*/g, '$1')       // *italic* → italic
        .replace(/__(.+?)__/g, '$1')       // __underline__ → underline
        .replace(/~~(.+?)~~/g, '$1')       // ~~strike~~ → strike
        .replace(/^#{1,6}\s+/gm, '')       // ## heading → heading (line start only)
        .replace(/\[(.+?)\]\(.+?\)/g, '$1'); // [text](url) → text

      if (!documentContent || documentContent.length < 100) {
        throw new Error(translate('doc_content_too_short_msg', 'Generated content is too short. Please provide more details and try again.'));
      }

      // Step 2: Create PDF/DOCX from AI-generated content
      setGenStatus(translate('doc_creating_file', 'Creating {FORMAT} file...').replace('{FORMAT}', selectedFormat.toUpperCase()));

      const result = await documentsApi.generateDocument({
        content: documentContent,
        title,
        format: selectedFormat,
      });

      if (result) {
        setGeneratedDoc({
          id: result.document_id || result.id,
          title: result.title || title,
          format: selectedFormat,
        });
        setGenStatus('');
        await fetchDocs();
      }
    } catch (e: any) {
      console.error('Document generation failed:', e);
      setError(e.message || translate('doc_failed_generate', 'Failed to generate document. Please try again.'));
      setGenStatus('');
    }
  };

  const handleDownload = async () => {
    if (!generatedDoc) return;
    try {
      await documentsApi.downloadDocument(generatedDoc.id, generatedDoc.title, generatedDoc.format);
    } catch (e) {
      console.error('Download failed:', e);
      setError(translate('failed_to_download_document', 'Failed to download document.'));
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm(translate('delete_document_confirmation', 'Are you sure you want to delete this document?'))) return;
    try {
      setError(null);
      await documentsApi.deleteDocument(docId);
      setDocs(prev => prev.filter(d => d.id !== docId));
    } catch (e: any) {
      console.error('Failed to delete document:', e);
      setError(e.message || translate('failed_to_delete_document', 'Failed to delete document.'));
    }
  };

  const resetGeneration = () => {
    setGenStep('templates');
    setView('list');
    setSelectedTemplate(null);
    setGeneratedDoc(null);
    setError(null);
    setGenStatus('');
    setSelectedFormat('pdf');
    setDetails({
      partyA: '',
      partyB: '',
      jurisdiction: selectedCountry === 'GE' ? 'საქართველო' : 'United States (Delaware)',
      effectiveDate: new Date().toISOString().split('T')[0],
      customClauses: ''
    });
  };

  const resetClaim = () => {
    setClaimStep('form_select');
    setView('list');
    setSelectedClaimForm(null);
    setClaimCategory('all');
    setGeneratedDoc(null);
    setError(null);
    setGenStatus('');
    setSelectedFormat('pdf');
    setClaimFileId(null);
    setClaimFileName('');
    setClaimDetails(Object.fromEntries(Object.keys(claimDetails).map(k => [k, ''])));
  };

  const handleClaimFileUpload = async (file: File) => {
    setUploadingClaim(true);
    try {
      const response = await chatApi.uploadFile(file);
      if (response?.file?.id) {
        setClaimFileId(response.file.id);
        setClaimFileName(file.name);
      }
    } catch (e) {
      console.error('File upload failed:', e);
      setError(translate('file_upload_failed', 'Failed to upload file. Please try again.'));
    } finally {
      setUploadingClaim(false);
    }
  };

  const handleClaimGenerate = async () => {
    if (!selectedClaimForm) return;

    if (!isPremium) {
      if (onOpenUpgrade) onOpenUpgrade();
      return;
    }

    const form = claimForms.find(f => f.id === selectedClaimForm);
    if (!form) return;

    // Minimum validation: at least one substantive field must be filled
    if (!claimDetails.plaintiff.trim() && !claimDetails.defendant.trim() && !claimDetails.basis.trim() && !claimDetails.demand.trim()) {
      setError(translate('claim_fill_minimum', 'Please fill in at least the parties or factual basis.'));
      return;
    }

    setClaimStep('generating');
    setError(null);
    setGeneratedDoc(null);
    setGenStatus(translate('doc_gen_ai_status', 'Generating document content with AI...'));

    const title = `${form.title} - ${claimDetails.plaintiff || translate('client', 'Client')} vs ${claimDetails.defendant || '...'}`;
    // AI-ს ეგზავნება მხოლოდ ის მონაცემები რაც უნდა დაამუშაოს (ფაქტები, თანხა, მოთხოვნა)
    // მომხმარებლის პერსონალური მონაცემები არ იგზავნება
    const prompt = buildClaimPrompt(form, claimDetails, language, !!claimFileId);

    try {
      setGenStatus(translate('claim_ai_drafting', 'AI is preparing your court document...'));

      const chatData = await chatApi.sendMessage({
        message: prompt,
        model_tier: 'premium',
        country_code: selectedCountry || 'GE',
        mode: 'claim_generation',
        ...(claimFileId ? { file_id: claimFileId } : {}),
      });

      const rawContent = typeof chatData === 'string' ? chatData : chatData?.content || '';

      // AI აბრუნებს JSON-ს — parse და validate
      const aiResult = parseClaimAIResponse(rawContent);

      // ოფიციალური ფორმის შევსება: მომხმარებლის მონაცემები + AI-ს სექციები → backend fills .docx template
      setGenStatus(translate('doc_creating_file', 'Creating document file...'));

      const docData = await documentsApi.fillForm({
        form_type: form.id,
        title,
        user_data: claimDetails,
        ai_data: aiResult,
      });

      setGeneratedDoc({
        id: docData.document_id || docData.id,
        title: docData.title || title,
        format: 'docx',
      });
      setGenStatus('');
      try { await fetchDocs(); } catch { /* list refresh failed — non-critical */ }
    } catch (e: any) {
      console.error('Claim generation failed:', e);
      setError(e.message || translate('claim_failed_generate', 'Failed to generate claim. Please try again.'));
      setGenStatus('');
    }
  };

  // Clean view switch — clear shared state to prevent cross-contamination
  const switchView = (target: 'list' | 'generate' | 'claims') => {
    setGeneratedDoc(null);
    setError(null);
    setGenStatus('');
    setSelectedFormat('pdf');
    if (target !== 'generate') {
      setGenStep('templates');
      setSelectedTemplate(null);
    }
    if (target !== 'claims') {
      setClaimStep('form_select');
      setSelectedClaimForm(null);
      setClaimFileId(null);
      setClaimFileName('');
      setClaimDetails(Object.fromEntries(Object.keys(claimDetails).map(k => [k, ''])));
    }
    setView(target);
  };

  const filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));

  if (view === 'generate') {
    return (
      <div className="flex-1 flex flex-col bg-[#fcfcf9] dark:bg-[#171717] h-screen overflow-hidden transition-colors">
        <div className="px-6 md:px-10 py-6 md:py-10 flex items-center justify-between border-b border-[#f0f0f0] dark:border-[#2d2d2d]">
          <div className="flex items-center gap-4">
            <button type="button"
              onClick={() => {
                if (genStep === 'details') setGenStep('templates');
                else if (genStep === 'generating') {
                  setGenStep('details');
                  setGeneratedDoc(null);
                  setError(null);
                  setGenStatus('');
                } else switchView('list');
              }}
              className="flex items-center gap-1.5 p-2 rounded-xl text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <h1 className="text-[24px] md:text-[32px] font-serif tracking-tight text-[#1a1a1a] dark:text-[#ececec]">
                {genStep === 'templates'
                  ? translate('doc_select_template', 'Select Template')
                  : genStep === 'details'
                    ? translate('doc_drafting_details', 'Drafting Details')
                    : generatedDoc
                      ? translate('document_ready', 'Document Ready')
                      : translate('generating', 'Generating...')}
              </h1>
              <p className="text-[13px] text-[#8e8e8e] font-serif italic">
                {genStep === 'templates'
                  ? translate('doc_choose_baseline', 'Choose a baseline for your legal instrument')
                  : genStep === 'details'
                    ? translate('doc_provide_context', 'Provide context for the AI drafter')
                    : generatedDoc
                      ? translate('doc_generated_success_msg', 'Your document has been generated successfully')
                      : translate('doc_ai_synthesizing', 'AI is synthesizing your legal document')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <div className={`w-2 h-2 rounded-full ${genStep === 'templates' ? 'bg-[#033C81]' : 'bg-[#e5e5e0] dark:bg-[#3d3d3d]'}`} />
              <div className={`w-2 h-2 rounded-full ${genStep === 'details' ? 'bg-[#033C81]' : 'bg-[#e5e5e0] dark:bg-[#3d3d3d]'}`} />
              <div className={`w-2 h-2 rounded-full ${genStep === 'generating' ? 'bg-[#033C81]' : 'bg-[#e5e5e0] dark:bg-[#3d3d3d]'}`} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-10 scrollbar-hide">
          <AnimatePresence mode="wait">
            {genStep === 'templates' && (
              <Motion.div
                key="step-templates"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto"
              >
                {/* Search and category filter */}
                <div className="mb-6 space-y-4">
                  <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
                    <input
                      type="text"
                      placeholder={translate('doc_search_templates', 'Search templates...')}
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#2d2d2d] text-[14px] text-[#1a1a1a] dark:text-[#ececec] rounded-xl outline-none focus:border-[#033C81] transition-colors"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setTemplateCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                          templateCategory === cat
                            ? 'bg-[#033C81] text-white'
                            : 'bg-[#f3f2ef] dark:bg-[#2d2d2d] text-[#676767] dark:text-[#8e8e8e] hover:bg-[#e5e5e0] dark:hover:bg-[#3d3d3d]'
                        }`}
                      >
                        {cat === 'all' ? translate('doc_all_filter', 'All') : cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
                  {filteredTemplates.map(t => (
                    <button type="button"
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`p-3.5 text-left rounded-2xl border transition-all flex items-start gap-3 ${
                        selectedTemplate === t.id
                          ? 'border-[#033C81] bg-[#033C81]/5 ring-1 ring-[#033C81]'
                          : 'border-[#e5e5e0] dark:border-[#2d2d2d] bg-white dark:bg-[#212121] hover:border-[#033C81]/50 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selectedTemplate === t.id ? 'bg-[#033C81] text-white' : 'bg-[#f3f2ef] dark:bg-[#2d2d2d] text-[#676767]'}`}>
                        <FileType className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[14px] font-medium text-[#1a1a1a] dark:text-[#ececec] truncate">{t.title}</h3>
                          {selectedTemplate === t.id && <Check className="w-3.5 h-3.5 text-[#033C81] shrink-0" />}
                        </div>
                        <p className="text-[11px] text-[#8e8e8e] truncate mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-4">
                  <button type="button" onClick={() => switchView('list')} className="px-6 py-3 text-[14px] font-medium text-[#676767] hover:text-black dark:hover:text-white transition-colors">
                    {translate('cancel', 'Cancel')}
                  </button>
                  <button type="button"
                    disabled={!selectedTemplate}
                    onClick={() => setGenStep('details')}
                    className={`px-10 py-3 rounded-xl text-[14px] font-bold shadow-lg transition-all flex items-center gap-2 ${
                      selectedTemplate
                        ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95'
                        : 'bg-gray-100 dark:bg-[#2d2d2d] text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {translate('continue_btn', 'Continue')} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </Motion.div>
            )}

            {genStep === 'details' && (
              <Motion.div
                key="step-details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto"
              >
                <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
                <div className="space-y-8 bg-white dark:bg-[#1a1a1a] p-5 md:p-8 rounded-[32px] border border-[#e5e5e0] dark:border-[#2d2d2d] shadow-sm">
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[#033C81]">
                        <UserPlus className="w-4 h-4" />
                        <h4 className="text-[14px] font-bold uppercase tracking-wider">
                          {translate('doc_parties', 'Parties')}
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[12px] text-[#8e8e8e]">
                            {translate('doc_first_party', 'First Party (Disclosing/Employer)')}
                          </label>
                          <input
                            type="text"
                            value={details.partyA}
                            onChange={(e) => setDetails(prev => ({ ...prev, partyA: e.target.value }))}
                            placeholder={translate('doc_full_legal_name', 'Full Legal Name')}
                            className="w-full bg-[#fcfcf9] dark:bg-[#212121] border border-[#e5e5e0] dark:border-[#2d2d2d] px-4 py-3 text-[15px] rounded-xl outline-none focus:border-[#033C81] transition-colors text-[#1a1a1a] dark:text-[#ececec]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[12px] text-[#8e8e8e]">
                            {translate('doc_second_party', 'Second Party (Receiving/Employee)')}
                          </label>
                          <input
                            type="text"
                            value={details.partyB}
                            onChange={(e) => setDetails(prev => ({ ...prev, partyB: e.target.value }))}
                            placeholder={translate('doc_full_legal_name', 'Full Legal Name')}
                            className="w-full bg-[#fcfcf9] dark:bg-[#212121] border border-[#e5e5e0] dark:border-[#2d2d2d] px-4 py-3 text-[15px] rounded-xl outline-none focus:border-[#033C81] transition-colors text-[#1a1a1a] dark:text-[#ececec]"
                          />
                        </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[#033C81]">
                          <Scale className="w-4 h-4" />
                          <h4 className="text-[14px] font-bold uppercase tracking-wider">
                            {translate('doc_jurisdiction', 'Jurisdiction')}
                          </h4>
                        </div>
                        <select
                          value={details.jurisdiction}
                          onChange={(e) => setDetails(prev => ({ ...prev, jurisdiction: e.target.value }))}
                          className="w-full bg-[#fcfcf9] dark:bg-[#212121] border border-[#e5e5e0] dark:border-[#2d2d2d] px-4 py-3 text-[15px] rounded-xl outline-none focus:border-[#033C81] transition-colors appearance-none text-[#1a1a1a] dark:text-[#ececec]"
                        >
                          {selectedCountry === 'GE' ? (
                            <>
                              <option>საქართველო</option>
                              <option>United States (Delaware)</option>
                              <option>United States (New York)</option>
                              <option>United Kingdom</option>
                              <option>European Union</option>
                            </>
                          ) : (
                            <>
                              <option>United States (Delaware)</option>
                              <option>United States (New York)</option>
                              <option>United Kingdom</option>
                              <option>European Union</option>
                              <option>Georgia</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[#033C81]">
                          <Calendar className="w-4 h-4" />
                          <h4 className="text-[14px] font-bold uppercase tracking-wider">
                            {translate('doc_effective_date', 'Effective Date')}
                          </h4>
                        </div>
                        <input
                          type="date"
                          value={details.effectiveDate}
                          onChange={(e) => setDetails(prev => ({ ...prev, effectiveDate: e.target.value }))}
                          className="w-full bg-[#fcfcf9] dark:bg-[#212121] border border-[#e5e5e0] dark:border-[#2d2d2d] px-4 py-3 text-[15px] rounded-xl outline-none focus:border-[#033C81] transition-colors text-[#1a1a1a] dark:text-[#ececec]"
                        />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[#033C81]">
                        <Sparkles className="w-4 h-4" />
                        <h4 className="text-[14px] font-bold uppercase tracking-wider">
                          {translate('doc_custom_instructions', 'Custom Instructions')}
                        </h4>
                      </div>
                      <textarea
                        placeholder={translate('doc_custom_placeholder', 'Add specific clauses, non-compete terms, payment details, or special conditions...')}
                        value={details.customClauses}
                        onChange={(e) => setDetails(prev => ({ ...prev, customClauses: e.target.value }))}
                        rows={4}
                        className="w-full bg-[#fcfcf9] dark:bg-[#212121] border border-[#e5e5e0] dark:border-[#2d2d2d] px-4 py-3 text-[15px] rounded-xl outline-none focus:border-[#033C81] transition-colors resize-none text-[#1a1a1a] dark:text-[#ececec]"
                      />
                   </div>

                   {/* Format Selection */}
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[#033C81]">
                        <FileText className="w-4 h-4" />
                        <h4 className="text-[14px] font-bold uppercase tracking-wider">
                          {translate('output_format', 'Output Format')}
                        </h4>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedFormat('pdf')}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 text-[14px] font-medium transition-all ${
                            selectedFormat === 'pdf'
                              ? 'border-[#033C81] bg-[#033C81]/10 text-[#033C81]'
                              : 'border-[#e5e5e0] dark:border-[#2d2d2d] text-[#676767] dark:text-[#8e8e8e] hover:border-[#033C81]/50'
                          }`}
                        >
                          <FileType className="w-4 h-4" />
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedFormat('docx')}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 text-[14px] font-medium transition-all ${
                            selectedFormat === 'docx'
                              ? 'border-[#033C81] bg-[#033C81]/10 text-[#033C81]'
                              : 'border-[#e5e5e0] dark:border-[#2d2d2d] text-[#676767] dark:text-[#8e8e8e] hover:border-[#033C81]/50'
                          }`}
                        >
                          <FileType className="w-4 h-4" />
                          DOCX
                        </button>
                      </div>
                   </div>
                </div>

                {/* Premium notice for non-premium users */}
                {!isPremium && (
                  <div className="mt-6 p-4 bg-[#033C81]/10 border border-[#033C81]/30 rounded-2xl flex items-start gap-3">
                    <Crown className="w-5 h-5 text-[#033C81] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[14px] font-medium text-[#1a1a1a] dark:text-[#ececec]">
                        {translate('doc_premium_feature', 'Premium Feature')}
                      </p>
                      <p className="text-[13px] text-[#676767] dark:text-[#8e8e8e]">
                        {translate('doc_premium_required', 'AI document generation requires a premium subscription.')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-4 mt-8">
                  <button type="button" onClick={() => setGenStep('templates')} className="px-6 py-3 text-[14px] font-medium text-[#676767] hover:text-black dark:hover:text-white transition-colors">
                    {translate('back', 'Back')}
                  </button>
                  <button type="submit"
                    className="px-10 py-3 rounded-xl text-[14px] font-bold shadow-lg transition-all flex items-center gap-2 bg-[#033C81] text-white hover:opacity-90 active:scale-95"
                  >
                    {!isPremium && <Lock className="w-4 h-4" />}
                    {isPremium
                      ? translate('doc_draft_btn', 'Draft Document')
                      : translate('doc_upgrade_to_gen', 'Upgrade to Generate')
                    }
                    {isPremium && <Sparkles className="w-4 h-4" />}
                  </button>
                </div>
                </form>
              </Motion.div>
            )}

            {genStep === 'generating' && (
              <Motion.div
                key="step-generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center"
              >
                {/* Success state */}
                {generatedDoc ? (
                  <>
                    <div className="mb-8">
                      <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                    </div>
                    <h2 className="text-[28px] md:text-[32px] font-serif mb-3 tracking-tight text-[#1a1a1a] dark:text-[#ececec]">
                      {translate('document_ready', 'Document Ready!')}
                    </h2>
                    <p className="text-[#676767] dark:text-[#8e8e8e] mb-8 text-lg font-serif italic">
                      {translate('doc_generated_success_title', 'Your legal document has been generated successfully.')}
                    </p>

                    {/* Document card */}
                    <div className="w-full bg-white dark:bg-[#212121] rounded-2xl border border-[#e5e5e0] dark:border-[#2d2d2d] p-5 mb-8 flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#f3f2ef] dark:bg-[#2d2d2d] rounded-xl flex items-center justify-center text-[#033C81]">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-[15px] font-medium text-[#1a1a1a] dark:text-[#ececec] truncate">{generatedDoc.title}</p>
                        <p className="text-[12px] text-[#8e8e8e] uppercase font-bold tracking-wider">{generatedDoc.format.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="flex gap-4 w-full">
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="flex-1 px-6 py-3.5 rounded-xl text-[14px] font-bold bg-[#033C81] text-white shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {translate('download', 'Download')}
                      </button>
                      <button
                        type="button"
                        onClick={resetGeneration}
                        className="flex-1 px-6 py-3.5 rounded-xl text-[14px] font-medium border border-[#e5e5e0] dark:border-[#2d2d2d] text-[#676767] dark:text-[#8e8e8e] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                      >
                        {translate('create_another', 'Create Another')}
                      </button>
                    </div>
                  </>
                ) : error ? (
                  /* Error state */
                  <>
                    <div className="mb-8">
                      <XCircle className="w-20 h-20 text-red-500 mx-auto" />
                    </div>
                    <h2 className="text-[28px] md:text-[32px] font-serif mb-3 tracking-tight text-[#1a1a1a] dark:text-[#ececec]">
                      {translate('doc_gen_failed', 'Generation Failed')}
                    </h2>
                    <p className="text-red-500 mb-8 text-[15px]">
                      {error}
                    </p>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setGenStep('details');
                        }}
                        className="px-8 py-3 rounded-xl text-[14px] font-bold bg-[#033C81] text-white shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        {translate('doc_try_again', 'Try Again')}
                      </button>
                      <button
                        type="button"
                        onClick={resetGeneration}
                        className="px-6 py-3 rounded-xl text-[14px] font-medium text-[#676767] hover:text-black dark:hover:text-white transition-colors"
                      >
                        {translate('cancel', 'Cancel')}
                      </button>
                    </div>
                  </>
                ) : (
                  /* In-progress state */
                  <>
                    <Sparkles className="w-10 h-10 text-[#033C81] animate-pulse mb-8" />
                    <h2 className="text-[32px] font-serif mb-4 tracking-tight text-[#1a1a1a] dark:text-[#ececec]">
                      {translate('doc_drafting_title', 'Drafting')} {templates.find(t => t.id === selectedTemplate)?.title}...
                    </h2>
                    <p className="text-[#676767] dark:text-[#8e8e8e] mb-10 leading-relaxed text-lg font-serif italic">
                      {genStatus || translate('doc_synth_default', 'Doctoringo is synthesizing jurisdictional precedents and applying your custom instructions to the final draft.')}
                    </p>

                    <div className="w-full space-y-3">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-[#8e8e8e]">
                        <span>{genStatus || translate('doc_synth_logic', 'Synthesizing Legal Logic')}</span>
                      </div>
                      <div className="w-full bg-[#f3f2ee] dark:bg-[#212121] h-2 rounded-full overflow-hidden">
                        <Motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: '92%' }}
                          transition={{ duration: 90, ease: [0.1, 0.5, 0.2, 1] }}
                          className="h-full bg-[#033C81]"
                        />
                      </div>
                    </div>
                  </>
                )}
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (view === 'claims') {
    const courtOptions = COURT_OPTIONS(language);
    return (
      <div className="flex-1 flex flex-col bg-[#fcfcf9] dark:bg-[#171717] h-screen overflow-hidden transition-colors">
        <div className="px-6 md:px-10 py-6 md:py-10 flex items-center justify-between border-b border-[#f0f0f0] dark:border-[#2d2d2d]">
          <div className="flex items-center gap-4">
            <button type="button"
              onClick={() => {
                if (claimStep === 'details') setClaimStep('form_select');
                else if (claimStep === 'generating') {
                  setClaimStep('details');
                  setGeneratedDoc(null);
                  setError(null);
                  setGenStatus('');
                } else switchView('list');
              }}
              className="flex items-center gap-1.5 p-2 rounded-xl text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <h1 className="text-[24px] md:text-[32px] font-serif tracking-tight text-[#1a1a1a] dark:text-[#ececec]">
                {claimStep === 'form_select'
                  ? translate('claim_select_form', 'Select Court Form')
                  : claimStep === 'details'
                    ? translate('claim_details', 'Claim Details')
                    : generatedDoc
                      ? translate('document_ready', 'Document Ready')
                      : translate('generating', 'Generating...')}
              </h1>
              <p className="text-[13px] text-[#8e8e8e] font-serif italic">
                {claimStep === 'form_select'
                  ? translate('claim_choose_form', 'Choose the type of court document to prepare')
                  : claimStep === 'details'
                    ? translate('claim_provide_info', 'Provide case details and upload supporting documents')
                    : generatedDoc
                      ? translate('claim_generated_success_msg', 'Your court document has been generated successfully')
                      : translate('claim_ai_preparing', 'AI is preparing your court document')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <div className={`w-2 h-2 rounded-full ${claimStep === 'form_select' ? 'bg-[#033C81]' : 'bg-[#e5e5e0] dark:bg-[#3d3d3d]'}`} />
              <div className={`w-2 h-2 rounded-full ${claimStep === 'details' ? 'bg-[#033C81]' : 'bg-[#e5e5e0] dark:bg-[#3d3d3d]'}`} />
              <div className={`w-2 h-2 rounded-full ${claimStep === 'generating' ? 'bg-[#033C81]' : 'bg-[#e5e5e0] dark:bg-[#3d3d3d]'}`} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-10 scrollbar-hide">
          <AnimatePresence mode="wait">
            {/* Step 1: Form Type Selection */}
            {claimStep === 'form_select' && (
              <Motion.div
                key="claim-form-select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto"
              >
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {claimCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setClaimCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                          claimCategory === cat
                            ? 'bg-[#033C81] text-white'
                            : 'bg-[#f3f2ef] dark:bg-[#2d2d2d] text-[#676767] dark:text-[#8e8e8e] hover:bg-[#e5e5e0] dark:hover:bg-[#3d3d3d]'
                        }`}
                      >
                        {cat === 'all' ? translate('doc_all_filter', 'All') : cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
                  {filteredClaimForms.map(f => (
                    <button type="button"
                      key={f.id}
                      onClick={() => setSelectedClaimForm(f.id)}
                      className={`p-4 text-left rounded-2xl border transition-all flex items-start gap-3 ${
                        selectedClaimForm === f.id
                          ? 'border-[#033C81] bg-[#033C81]/5 ring-1 ring-[#033C81]'
                          : 'border-[#e5e5e0] dark:border-[#2d2d2d] bg-white dark:bg-[#212121] hover:border-[#033C81]/50 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selectedClaimForm === f.id ? 'bg-[#033C81] text-white' : 'bg-[#f3f2ef] dark:bg-[#2d2d2d] text-[#676767]'}`}>
                        <Scale className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-medium text-[#1a1a1a] dark:text-[#ececec]">{f.title}</h3>
                          {selectedClaimForm === f.id && <Check className="w-3.5 h-3.5 text-[#033C81] shrink-0" />}
                        </div>
                        <p className="text-[12px] text-[#8e8e8e] mt-0.5">{f.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-4">
                  <button type="button" onClick={() => switchView('list')} className="px-6 py-3 text-[14px] font-medium text-[#676767] hover:text-black dark:hover:text-white transition-colors">
                    {translate('cancel', 'Cancel')}
                  </button>
                  <button type="button"
                    disabled={!selectedClaimForm}
                    onClick={() => setClaimStep('details')}
                    className={`px-10 py-3 rounded-xl text-[14px] font-bold shadow-lg transition-all flex items-center gap-2 ${
                      selectedClaimForm
                        ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95'
                        : 'bg-gray-100 dark:bg-[#2d2d2d] text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {translate('continue_btn', 'Continue')} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </Motion.div>
            )}

            {/* Step 2: Claim Details + File Upload */}
            {claimStep === 'details' && (
              <Motion.div
                key="claim-details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto"
              >
                <form onSubmit={(e) => { e.preventDefault(); handleClaimGenerate(); }}>
                <div className="space-y-8 bg-white dark:bg-[#1a1a1a] p-5 md:p-8 rounded-[32px] border border-[#e5e5e0] dark:border-[#2d2d2d] shadow-sm">

                  {/* Court Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#033C81]">
                      <Scale className="w-4 h-4" />
                      <h4 className="text-[14px] font-bold uppercase tracking-wider">
                        {translate('claim_court', 'Court')}
                      </h4>
                    </div>
                    <select
                      value={claimDetails.court}
                      onChange={(e) => setClaimDetails({ ...claimDetails, court: e.target.value })}
                      className="w-full px-4 py-3 bg-[#fcfcf9] dark:bg-[#212121] border border-[#e5e5e0] dark:border-[#2d2d2d] text-[15px] text-[#1a1a1a] dark:text-[#ececec] rounded-xl outline-none focus:border-[#033C81] transition-colors"
                    >
                      <option value="">{translate('claim_select_court', 'Select court...')}</option>
                      {courtOptions.map(c => (
                        <option key={c.value} value={c.label}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic form fields based on selected form type */}
                  {(() => {
                    const formFields = selectedClaimForm ? (CLAIM_FORM_FIELDS[selectedClaimForm] || []) : [];
                    const inputCls = "w-full px-4 py-3 bg-[#fcfcf9] dark:bg-[#212121] border border-[#e5e5e0] dark:border-[#2d2d2d] text-[15px] text-[#1a1a1a] dark:text-[#ececec] rounded-xl outline-none focus:border-[#033C81] transition-colors";
                    const textareaCls = `${inputCls} resize-none`;
                    const sectionHeader = (icon: React.ReactNode, label: string) => (
                      <div className="flex items-center gap-2 text-[#033C81]">
                        {icon}
                        <h4 className="text-[14px] font-bold uppercase tracking-wider">{label}</h4>
                      </div>
                    );
                    const hasField = (f: ClaimFieldKey) => formFields.includes(f);

                    return (
                      <>
                        {/* Case Number — შესაგებელი, აპელაცია, კასაცია */}
                        {hasField('caseNumber') && (
                          <div className="space-y-4">
                            {sectionHeader(<FileText className="w-4 h-4" />, translate('claim_case_number', 'Case Number'))}
                            <input type="text" value={claimDetails.caseNumber || ''} onChange={(e) => setClaimDetails({ ...claimDetails, caseNumber: e.target.value })} placeholder={translate('claim_case_number_placeholder', 'Case number (e.g., 2/1234-25)')} className={inputCls} />
                          </div>
                        )}

                        {/* Plaintiff / Appellant */}
                        {hasField('plaintiff') && (
                          <div className="space-y-4">
                            {sectionHeader(<UserPlus className="w-4 h-4" />, translate('claim_plaintiff', 'Plaintiff (Your details)'))}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input type="text" value={claimDetails.plaintiff || ''} onChange={(e) => setClaimDetails({ ...claimDetails, plaintiff: e.target.value })} placeholder={translate('claim_fullname', 'Full name / Company name')} className={inputCls} />
                              {hasField('plaintiffId') && <input type="text" value={claimDetails.plaintiffId || ''} onChange={(e) => setClaimDetails({ ...claimDetails, plaintiffId: e.target.value })} placeholder={translate('claim_personal_id', 'Personal ID / Registration #')} className={inputCls} />}
                              {hasField('plaintiffAddress') && <input type="text" value={claimDetails.plaintiffAddress || ''} onChange={(e) => setClaimDetails({ ...claimDetails, plaintiffAddress: e.target.value })} placeholder={translate('claim_address', 'Address')} className={inputCls} />}
                              {hasField('plaintiffPhone') && <input type="text" value={claimDetails.plaintiffPhone || ''} onChange={(e) => setClaimDetails({ ...claimDetails, plaintiffPhone: e.target.value })} placeholder={translate('claim_phone', 'Phone number')} className={inputCls} />}
                              {hasField('plaintiffEmail') && <input type="email" value={claimDetails.plaintiffEmail || ''} onChange={(e) => setClaimDetails({ ...claimDetails, plaintiffEmail: e.target.value })} placeholder={translate('claim_email', 'Email')} className={inputCls} />}
                            </div>
                          </div>
                        )}

                        {/* Representative */}
                        {hasField('representative') && (
                          <div className="space-y-4">
                            {sectionHeader(<UserPlus className="w-4 h-4" />, translate('claim_representative', 'Representative (optional)'))}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input type="text" value={claimDetails.representative || ''} onChange={(e) => setClaimDetails({ ...claimDetails, representative: e.target.value })} placeholder={translate('claim_fullname', 'Full name / Company name')} className={inputCls} />
                              {hasField('representativeId') && <input type="text" value={claimDetails.representativeId || ''} onChange={(e) => setClaimDetails({ ...claimDetails, representativeId: e.target.value })} placeholder={translate('claim_personal_id', 'Personal ID / Registration #')} className={inputCls} />}
                              {hasField('representativeAddress') && <input type="text" value={claimDetails.representativeAddress || ''} onChange={(e) => setClaimDetails({ ...claimDetails, representativeAddress: e.target.value })} placeholder={translate('claim_address', 'Address')} className={inputCls} />}
                              {hasField('representativePhone') && <input type="text" value={claimDetails.representativePhone || ''} onChange={(e) => setClaimDetails({ ...claimDetails, representativePhone: e.target.value })} placeholder={translate('claim_phone', 'Phone number')} className={inputCls} />}
                            </div>
                          </div>
                        )}

                        {/* Defendant */}
                        {hasField('defendant') && (
                          <div className="space-y-4">
                            {sectionHeader(<UserPlus className="w-4 h-4" />, translate('claim_defendant', 'Defendant'))}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input type="text" value={claimDetails.defendant || ''} onChange={(e) => setClaimDetails({ ...claimDetails, defendant: e.target.value })} placeholder={translate('claim_fullname', 'Full name / Company name')} className={inputCls} />
                              {hasField('defendantId') && <input type="text" value={claimDetails.defendantId || ''} onChange={(e) => setClaimDetails({ ...claimDetails, defendantId: e.target.value })} placeholder={translate('claim_personal_id', 'Personal ID / Registration #')} className={inputCls} />}
                              {hasField('defendantAddress') && <input type="text" value={claimDetails.defendantAddress || ''} onChange={(e) => setClaimDetails({ ...claimDetails, defendantAddress: e.target.value })} placeholder={translate('claim_address', 'Address')} className={inputCls} />}
                              {hasField('defendantPhone') && <input type="text" value={claimDetails.defendantPhone || ''} onChange={(e) => setClaimDetails({ ...claimDetails, defendantPhone: e.target.value })} placeholder={translate('claim_phone', 'Phone number')} className={inputCls} />}
                            </div>
                          </div>
                        )}

                        {/* Administrative Body / Act */}
                        {hasField('adminBody') && (
                          <div className="space-y-4">
                            {sectionHeader(<Scale className="w-4 h-4" />, translate('claim_admin_body', 'Administrative Body'))}
                            <input type="text" value={claimDetails.adminBody || ''} onChange={(e) => setClaimDetails({ ...claimDetails, adminBody: e.target.value })} placeholder={translate('claim_admin_body_placeholder', 'Name of administrative body or official')} className={inputCls} />
                            {hasField('adminAct') && <input type="text" value={claimDetails.adminAct || ''} onChange={(e) => setClaimDetails({ ...claimDetails, adminAct: e.target.value })} placeholder={translate('claim_admin_act_placeholder', 'Administrative act / decision being contested')} className={inputCls} />}
                          </div>
                        )}

                        {/* Contested Decision — აპელაცია / კასაცია */}
                        {hasField('contestedDecision') && (
                          <div className="space-y-4">
                            {sectionHeader(<FileText className="w-4 h-4" />, translate('claim_contested_decision', 'Contested Decision'))}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input type="text" value={claimDetails.contestedDecision || ''} onChange={(e) => setClaimDetails({ ...claimDetails, contestedDecision: e.target.value })} placeholder={translate('claim_contested_decision_placeholder', 'Court and decision details')} className={`md:col-span-2 ${inputCls}`} />
                              {hasField('contestedDecisionDate') && <input type="date" value={claimDetails.contestedDecisionDate || ''} onChange={(e) => setClaimDetails({ ...claimDetails, contestedDecisionDate: e.target.value })} className={inputCls} />}
                            </div>
                          </div>
                        )}

                        {/* Claim Subject — სარჩელის საგანი */}
                        {hasField('claimSubject') && (
                          <div className="space-y-4">
                            {sectionHeader(<FileText className="w-4 h-4" />, translate('claim_subject', 'Subject of Claim'))}
                            <input type="text" value={claimDetails.claimSubject || ''} onChange={(e) => setClaimDetails({ ...claimDetails, claimSubject: e.target.value })} placeholder={translate('claim_subject_placeholder', 'Subject of the claim (e.g., debt recovery, contract termination...)')} className={inputCls} />
                          </div>
                        )}

                        {/* Claim Amount */}
                        {hasField('amount') && (
                          <div className="space-y-4">
                            {sectionHeader(<FileText className="w-4 h-4" />, translate('claim_amount_section', 'Claim Amount'))}
                            <input type="text" inputMode="numeric" value={claimDetails.amount || ''} onChange={(e) => setClaimDetails({ ...claimDetails, amount: e.target.value })} placeholder={translate('claim_amount_placeholder', 'Amount in GEL (optional)')} className={inputCls} />
                          </div>
                        )}

                        {/* Appeal Grounds — აპელაცია / კასაცია */}
                        {hasField('appealGrounds') && (
                          <div className="space-y-4">
                            {sectionHeader(<AlignLeft className="w-4 h-4" />, translate('claim_appeal_grounds', 'Grounds for Appeal'))}
                            <textarea value={claimDetails.appealGrounds || ''} onChange={(e) => setClaimDetails({ ...claimDetails, appealGrounds: e.target.value })} placeholder={translate('claim_appeal_grounds_placeholder', 'Why do you disagree with the decision? Specify legal and factual errors...')} rows={4} className={textareaCls} />
                          </div>
                        )}

                        {/* Factual Basis */}
                        {hasField('basis') && (
                          <div className="space-y-4">
                            {sectionHeader(<AlignLeft className="w-4 h-4" />, translate('claim_basis', 'Factual Basis'))}
                            <textarea value={claimDetails.basis || ''} onChange={(e) => setClaimDetails({ ...claimDetails, basis: e.target.value })} placeholder={translate('claim_basis_placeholder', 'Describe what happened — the facts and circumstances of the dispute...')} rows={4} className={textareaCls} />
                          </div>
                        )}

                        {/* File Upload */}
                        <div className="space-y-4">
                          {sectionHeader(<Upload className="w-4 h-4" />, translate('claim_document_upload', 'Supporting Document'))}
                          <p className="text-[12px] text-[#8e8e8e]">{translate('claim_upload_hint', 'Upload the contract or agreement that serves as the basis for your claim (optional)')}</p>
                          <input ref={claimFileRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleClaimFileUpload(file); if (claimFileRef.current) claimFileRef.current.value = ''; }} />
                          {claimFileName ? (
                            <div className="flex items-center gap-3 p-4 bg-[#033C81]/5 border border-[#033C81]/20 rounded-xl">
                              <CheckCircle className="w-5 h-5 text-[#033C81] shrink-0" />
                              <span className="text-[14px] text-[#1a1a1a] dark:text-[#ececec] truncate flex-1">{claimFileName}</span>
                              <button type="button" onClick={() => { setClaimFileId(null); setClaimFileName(''); }} className="text-[#8e8e8e] hover:text-red-500 transition-colors"><XCircle className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => claimFileRef.current?.click()} disabled={uploadingClaim} className="w-full p-4 md:p-6 border-2 border-dashed border-[#e5e5e0] dark:border-[#2d2d2d] rounded-xl text-center hover:border-[#033C81]/50 transition-colors cursor-pointer" onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const file = e.dataTransfer.files?.[0]; if (file) handleClaimFileUpload(file); }}>
                              {uploadingClaim ? (
                                <div className="flex items-center justify-center gap-2 text-[#8e8e8e]"><div className="w-4 h-4 border-2 border-[#033C81] border-t-transparent rounded-full animate-spin" /><span className="text-[13px]">{translate('uploading', 'Uploading...')}</span></div>
                              ) : (
                                <div className="flex flex-col items-center gap-2 text-[#8e8e8e]"><Upload className="w-6 h-6" /><span className="text-[13px]">{translate('claim_drop_or_click', 'Drop file here or click to upload')}</span><span className="text-[11px]">PDF, DOCX, TXT</span></div>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Demand / Relief Sought */}
                        {hasField('demand') && (
                          <div className="space-y-4">
                            {sectionHeader(<CheckCircle className="w-4 h-4" />, translate('claim_demand', 'Relief Sought'))}
                            <textarea value={claimDetails.demand || ''} onChange={(e) => setClaimDetails({ ...claimDetails, demand: e.target.value })} placeholder={translate('claim_demand_placeholder', 'What do you want the court to decide? E.g., payment of amount, contract termination, damages...')} rows={3} className={textareaCls} />
                          </div>
                        )}

                        {/* Evidence List — მტკიცებულებათა ჩამონათვალი */}
                        {hasField('evidence') && (
                          <div className="space-y-4">
                            {sectionHeader(<FileText className="w-4 h-4" />, translate('claim_evidence', 'List of Evidence'))}
                            <textarea value={claimDetails.evidence || ''} onChange={(e) => setClaimDetails({ ...claimDetails, evidence: e.target.value })} placeholder={translate('claim_evidence_placeholder', 'List the evidence you are attaching (contracts, receipts, correspondence, witnesses...)')} rows={3} className={textareaCls} />
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Format Selection */}
                  <div className="space-y-4">
                    <h4 className="text-[14px] font-bold uppercase tracking-wider text-[#8e8e8e]">
                      {translate('doc_output_format', 'Output Format')}
                    </h4>
                    <div className="flex gap-3">
                      {(['pdf', 'docx'] as const).map(fmt => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setSelectedFormat(fmt)}
                          className={`px-6 py-2.5 rounded-xl text-[14px] font-semibold border transition-all ${
                            selectedFormat === fmt
                              ? 'border-[#033C81] bg-[#033C81]/5 text-[#033C81]'
                              : 'border-[#e5e5e0] dark:border-[#2d2d2d] text-[#676767] hover:border-[#033C81]/50'
                          }`}
                        >
                          {fmt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Premium Lock Notice */}
                  {!isPremium && (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
                      <Crown className="w-5 h-5 text-amber-500 shrink-0" />
                      <p className="text-[13px] text-amber-700 dark:text-amber-400">
                        {translate('claim_premium_required', 'Claim preparation requires a premium subscription')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <button type="button" onClick={() => setClaimStep('form_select')} className="px-6 py-3 text-[14px] font-medium text-[#676767] hover:text-black dark:hover:text-white transition-colors">
                    {translate('back', 'Back')}
                  </button>
                  <button type="submit"
                    className="px-10 py-3 rounded-xl text-[14px] font-bold shadow-lg bg-[#033C81] text-white hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                  >
                    {!isPremium && <Lock className="w-4 h-4" />}
                    {isPremium
                      ? translate('claim_generate_btn', 'Generate Claim')
                      : translate('doc_upgrade_to_gen', 'Upgrade to Generate')
                    }
                    {isPremium && <Scale className="w-4 h-4" />}
                  </button>
                </div>
                </form>
              </Motion.div>
            )}

            {/* Step 3: Generating / Result */}
            {claimStep === 'generating' && (
              <Motion.div
                key="claim-generating"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto text-center py-16"
              >
                {generatedDoc ? (
                  <>
                    <div className="mb-8">
                      <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                    </div>
                    <h2 className="text-[28px] md:text-[32px] font-serif mb-3 tracking-tight text-[#1a1a1a] dark:text-[#ececec]">
                      {translate('claim_ready', 'Court Document Ready')}
                    </h2>
                    <p className="text-[#676767] dark:text-[#8e8e8e] mb-8 text-[15px]">
                      {generatedDoc.title}
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await documentsApi.downloadDocument(generatedDoc.id, generatedDoc.title, generatedDoc.format);
                          } catch (e: any) {
                            setError(e.message || translate('download_failed', 'Failed to download document.'));
                          }
                        }}
                        className="px-8 py-3 rounded-xl text-[14px] font-bold bg-[#033C81] text-white shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {translate('download', 'Download')} {generatedDoc.format.toUpperCase()}
                      </button>
                      <button
                        type="button"
                        onClick={resetClaim}
                        className="px-6 py-3 rounded-xl text-[14px] font-medium text-[#676767] hover:text-black dark:hover:text-white transition-colors"
                      >
                        {translate('claim_new', 'New Claim')}
                      </button>
                    </div>
                  </>
                ) : error ? (
                  <>
                    <div className="mb-8">
                      <XCircle className="w-20 h-20 text-red-500 mx-auto" />
                    </div>
                    <h2 className="text-[28px] md:text-[32px] font-serif mb-3 tracking-tight text-[#1a1a1a] dark:text-[#ececec]">
                      {translate('doc_gen_failed', 'Generation Failed')}
                    </h2>
                    <p className="text-red-500 mb-8 text-[15px]">
                      {error}
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setClaimStep('details');
                        }}
                        className="px-8 py-3 rounded-xl text-[14px] font-bold bg-[#033C81] text-white shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        {translate('doc_try_again', 'Try Again')}
                      </button>
                      <button
                        type="button"
                        onClick={resetClaim}
                        className="px-6 py-3 rounded-xl text-[14px] font-medium text-[#676767] hover:text-black dark:hover:text-white transition-colors"
                      >
                        {translate('cancel', 'Cancel')}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Scale className="w-10 h-10 text-[#033C81] animate-pulse mb-8" />
                    <h2 className="text-[32px] font-serif mb-4 tracking-tight text-[#1a1a1a] dark:text-[#ececec]">
                      {translate('claim_drafting_title', 'Preparing')} {claimForms.find(f => f.id === selectedClaimForm)?.title}...
                    </h2>
                    <p className="text-[#676767] dark:text-[#8e8e8e] mb-10 leading-relaxed text-lg font-serif italic">
                      {genStatus || translate('claim_synth_default', 'Doctoringo is analyzing case details and preparing your court document according to Georgian legislation.')}
                    </p>
                    <div className="w-full space-y-3">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-[#8e8e8e]">
                        <span>{genStatus || translate('claim_synth_logic', 'Analyzing Legal Framework')}</span>
                      </div>
                      <div className="w-full bg-[#f3f2ee] dark:bg-[#212121] h-2 rounded-full overflow-hidden">
                        <Motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: '92%' }}
                          transition={{ duration: 90, ease: [0.1, 0.5, 0.2, 1] }}
                          className="h-full bg-[#033C81]"
                        />
                      </div>
                    </div>
                  </>
                )}
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#fcfcf9] dark:bg-[#171717] h-screen overflow-hidden">
      <div className="px-5 md:px-10 py-6 md:py-10 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <button type="button"
            onClick={() => onOpenMobileMenu?.()}
            className="md:hidden w-10 h-10 flex items-center justify-center bg-white dark:bg-[#212121] rounded-full shadow-md border border-[#f0f0f0] dark:border-[#2d2d2d] active:scale-95 transition-all"
          >
            <AlignLeft className="w-4.5 h-4.5 text-[#1a1a1a] dark:text-[#ececec]" />
          </button>
          <h1 className="text-[24px] md:text-[36px] font-serif tracking-tight text-[#1a1a1a] dark:text-[#ececec]">
            {translate('documents', 'Documents')}
          </h1>
        </div>
        {!user?.subscription?.is_paid && onOpenUpgrade && (
          <button type="button"
            onClick={onOpenUpgrade}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold text-white transition-all hover:brightness-110 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #033C81 0%, #c47a58 100%)' }}
          >
            <Zap className="w-3.5 h-3.5" fill="currentColor" />
            {translate('upgrade', 'Upgrade')}
          </button>
        )}
      </div>

      <div className="px-5 md:px-10 mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative max-w-lg flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8e8e8e]" />
          <input
            type="text"
            placeholder={translate('doc_search_docs', 'Search your documents...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 md:pl-12 pr-4 py-2.5 md:py-3 bg-white dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#2d2d2d] text-[15px] md:text-[16px] text-[#1a1a1a] dark:text-[#ececec] rounded-2xl outline-none focus:border-[#033C81] transition-colors shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => switchView('generate')}
            className="px-4 py-2.5 rounded-xl text-[13px] font-bold bg-[#033C81] text-white shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {translate('generate_document', 'Generate Document')}
          </button>
          <button
            type="button"
            onClick={() => switchView('claims')}
            className="px-4 py-2.5 rounded-xl text-[13px] font-bold border border-[#033C81] text-[#033C81] hover:bg-[#033C81]/5 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Scale className="w-3.5 h-3.5" />
            {translate('prepare_claim', 'Prepare Claim')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-5 md:mx-10 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[13px] flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 md:px-10 pb-20 md:pb-10 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#033C81] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-16 h-16 text-[#e5e5e0] dark:text-[#2d2d2d] mb-6" />
            <h3 className="text-[18px] font-serif text-[#676767] dark:text-[#8e8e8e] mb-2">
              {search
                ? translate('doc_no_found', 'No documents found')
                : translate('doc_no_yet', 'No documents yet')}
            </h3>
            <p className="text-[14px] text-[#8e8e8e] mb-6">
              {translate('doc_first_ai_prompt', 'Generate your first legal document using AI')}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => switchView('generate')}
                className="px-6 py-2.5 rounded-xl text-[14px] font-bold bg-[#033C81] text-white shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {translate('generate_document', 'Generate Document')}
              </button>
              <button
                type="button"
                onClick={() => switchView('claims')}
                className="px-6 py-2.5 rounded-xl text-[14px] font-bold border border-[#033C81] text-[#033C81] hover:bg-[#033C81]/5 active:scale-95 transition-all flex items-center gap-2"
              >
                <Scale className="w-4 h-4" />
                {translate('prepare_claim', 'Prepare Claim')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filtered.map(doc => (
              <Motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group p-5 md:p-6 bg-white dark:bg-[#212121] rounded-[24px] border border-[#e5e5e5] dark:border-[#2d2d2d] hover:shadow-md transition-all relative"
              >
                <div className="w-10 h-10 bg-[#f3f2ef] dark:bg-[#2d2d2d] rounded-xl flex items-center justify-center text-[#033C81] mb-4 md:mb-6">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-[16px] md:text-[17px] font-medium mb-1 truncate text-[#1a1a1a] dark:text-[#ececec]">{doc.title}</h3>
                <p className="text-[11px] md:text-[12px] text-[#8e8e8e] mb-5 md:mb-6 uppercase font-bold tracking-wider">{doc.format} • {new Date(doc.created_at).toLocaleDateString()}</p>

                <div className="flex items-center gap-2">
                  <button type="button" onClick={async () => {
                      try {
                        await documentsApi.downloadDocument(doc.id, doc.title, doc.format);
                      } catch (e: any) {
                        setError(e.message || translate('download_failed', 'Failed to download document.'));
                      }
                    }} className="p-2 bg-[#f9f9f9] dark:bg-[#2a2a2a] border border-[#e5e5e5] dark:border-[#2d2d2d] rounded-lg hover:bg-[#f0f0f0] dark:hover:bg-[#333] transition-colors">
                    <Download className="w-4 h-4 text-[#676767] dark:text-[#8e8e8e]" />
                  </button>
                  <button type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg ml-auto transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
