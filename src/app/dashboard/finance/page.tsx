import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { createExpenseAction, createManualIncomeAction } from '@/actions/dashboard';
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PnlRow {
  month: string;
  income: number;
  expense: number;
  profit: number;
}

interface ExpenseRow {
  id: string;
  title: string;
  amount: number;
  expense_date: string;
  finance_categories: { name: string } | null;
}

export default async function FinancePage() {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'accountant'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  const [pnlRes, expensesRes, incomesRes, categoriesRes, coursesRes] = await Promise.all([
    supabase.rpc('finance_monthly_pnl', {}),
    supabase
      .from('expenses')
      .select('id, title, amount, expense_date, finance_categories(name)')
      .order('expense_date', { ascending: false })
      .limit(20),
    supabase
      .from('manual_incomes')
      .select('id, title, amount, income_date')
      .order('income_date', { ascending: false })
      .limit(20),
    supabase.from('finance_categories').select('id, name, kind').order('name'),
    supabase.from('courses').select('id, title').order('title'),
  ]);

  const pnl = (pnlRes.data as PnlRow[]) ?? [];
  const expenses = (expensesRes.data as unknown as ExpenseRow[]) ?? [];
  const incomes = (incomesRes.data as { id: string; title: string; amount: number; income_date: string }[]) ?? [];
  const categories = (categoriesRes.data as { id: string; name: string; kind: string }[]) ?? [];
  const courses = (coursesRes.data as { id: string; title: string }[]) ?? [];

  const totalIncome = pnl.reduce((sum, row) => sum + Number(row.income), 0);
  const totalExpense = pnl.reduce((sum, row) => sum + Number(row.expense), 0);

  return (
    <>
      <PageHeader
        title="Finance"
        description="Income and expenses, monthly profit/loss from the finance_monthly_pnl function."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Income (12m)" value={formatCurrency(totalIncome)} />
        <StatCard label="Expense (12m)" value={formatCurrency(totalExpense)} />
        <StatCard
          label="Profit (12m)"
          value={formatCurrency(totalIncome - totalExpense)}
          hint="Verified payments + manual income - expenses"
        />
      </div>

      <Card className="mb-6">
        <CardHeader title="Monthly profit / loss" />
        <CardBody className="p-0">
          {pnl.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No finance data yet" />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Month</Th>
                  <Th>Income</Th>
                  <Th>Expense</Th>
                  <Th>Profit</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pnl.map((row) => (
                  <tr key={row.month}>
                    <Td className="font-medium text-slate-900">
                      {new Date(row.month).toLocaleDateString('en-GB', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Td>
                    <Td className="text-emerald-700">{formatCurrency(row.income)}</Td>
                    <Td className="text-red-600">{formatCurrency(row.expense)}</Td>
                    <Td className={Number(row.profit) >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                      {formatCurrency(row.profit)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Record expense" />
          <CardBody>
            <form action={createExpenseAction} className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Title">
                  <Input name="title" required />
                </Field>
              </div>
              <Field label="Amount">
                <Input name="amount" type="number" min="0" step="0.01" required />
              </Field>
              <Field label="Date">
                <Input name="expense_date" type="date" />
              </Field>
              <Field label="Category">
                <Select name="category_id" defaultValue="">
                  <option value="">Uncategorized</option>
                  {categories
                    .filter((category) => category.kind === 'expense')
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Course (optional)">
                <Select name="course_id" defaultValue="">
                  <option value="">General</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Paid to">
                <Input name="paid_to" />
              </Field>
              <Field label="Method">
                <Input name="method" />
              </Field>
              <div className="sm:col-span-2">
                <SubmitButton pendingLabel="Saving...">Add expense</SubmitButton>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Record manual income" />
          <CardBody>
            <form action={createManualIncomeAction} className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Title">
                  <Input name="title" required />
                </Field>
              </div>
              <Field label="Amount">
                <Input name="amount" type="number" min="0" step="0.01" required />
              </Field>
              <Field label="Date">
                <Input name="income_date" type="date" />
              </Field>
              <Field label="Category">
                <Select name="category_id" defaultValue="">
                  <option value="">Uncategorized</option>
                  {categories
                    .filter((category) => category.kind === 'income')
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Course (optional)">
                <Select name="course_id" defaultValue="">
                  <option value="">General</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Source">
                  <Input name="source" placeholder="e.g. Admission desk" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <SubmitButton pendingLabel="Saving...">Add income</SubmitButton>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent expenses" />
          <CardBody className="p-0">
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Title</Th>
                  <Th>Category</Th>
                  <Th>Date</Th>
                  <Th>Amount</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <Td>{expense.title}</Td>
                    <Td className="text-xs text-slate-500">
                      {expense.finance_categories?.name ?? '-'}
                    </Td>
                    <Td className="text-xs text-slate-500">{formatDate(expense.expense_date)}</Td>
                    <Td className="text-red-600">{formatCurrency(expense.amount)}</Td>
                  </tr>
                ))}
                {expenses.length === 0 ? (
                  <tr>
                    <Td className="text-xs text-slate-400">No expenses recorded.</Td>
                    <Td>{''}</Td>
                    <Td>{''}</Td>
                    <Td>{''}</Td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent manual income" />
          <CardBody className="p-0">
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Title</Th>
                  <Th>Date</Th>
                  <Th>Amount</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomes.map((income) => (
                  <tr key={income.id}>
                    <Td>{income.title}</Td>
                    <Td className="text-xs text-slate-500">{formatDate(income.income_date)}</Td>
                    <Td className="text-emerald-700">{formatCurrency(income.amount)}</Td>
                  </tr>
                ))}
                {incomes.length === 0 ? (
                  <tr>
                    <Td className="text-xs text-slate-400">No manual income recorded.</Td>
                    <Td>{''}</Td>
                    <Td>{''}</Td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
