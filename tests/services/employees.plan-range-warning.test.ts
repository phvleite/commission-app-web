import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { Employee } from '@/models/Employee'
import { Tenant } from '@/models/Tenant'
import { getEmployeePlanRangeWarning } from '@/services/employees/getEmployeePlanRangeWarning'

describe('getEmployeePlanRangeWarning', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => clearTestDB())

    it('conta somente colaboradores ativos e alerta acima da faixa', async () => {
        const tenantId = new Types.ObjectId()
        const sectorId = new Types.ObjectId()
        await Tenant.collection.insertOne({
            _id: tenantId,
            name: 'Empresa Faixa 50',
            legalName: 'Empresa Faixa 50 LTDA',
            slug: 'empresa-faixa-50',
            planCode: 'plan_50',
        })
        await Employee.collection.insertMany([
            ...Array.from({ length: 50 }, (_, index) => ({
                tenantId,
                sectorId,
                name: `Ativo ${index + 1}`,
                admissionDate: new Date('2024-01-01'),
                active: true,
            })),
            {
                tenantId,
                sectorId,
                name: 'Inativo',
                admissionDate: new Date('2024-01-01'),
                active: false,
            },
        ])

        await expect(getEmployeePlanRangeWarning(tenantId.toString())).resolves.toBeUndefined()

        await Employee.updateOne({ name: 'Inativo' }, { $set: { active: true } })

        await expect(getEmployeePlanRangeWarning(tenantId.toString())).resolves.toContain(
            'ultrapassou a faixa de até 50 colaboradores',
        )
    })

    it('nao alerta no plano sem limite de colaboradores', async () => {
        const tenantId = new Types.ObjectId()
        const sectorId = new Types.ObjectId()
        await Tenant.collection.insertOne({
            _id: tenantId,
            name: 'Empresa Sem Limite',
            legalName: 'Empresa Sem Limite LTDA',
            slug: 'empresa-sem-limite',
            planCode: 'plan_100_plus',
        })
        await Employee.collection.insertMany(
            Array.from({ length: 101 }, (_, index) => ({
                tenantId,
                sectorId,
                name: `Ativo ${index + 1}`,
                admissionDate: new Date('2024-01-01'),
                active: true,
            })),
        )

        await expect(getEmployeePlanRangeWarning(tenantId.toString())).resolves.toBeUndefined()
    })
})
