import { FormulaDB } from "@/types/schema";
import { ApiClient } from "./api-client";

export class FormulasApi extends ApiClient {
  constructor() {
    super("/api");
  }

  async obtenerFormulas(): Promise<FormulaDB[]> {
    return this.get<FormulaDB[]>("/formulas");
  }

  async obtenerFormula(id: number): Promise<FormulaDB> {
    return this.get<FormulaDB>(`/formulas/${id}`);
  }

  async crearFormula(formula: Omit<FormulaDB, "id">): Promise<FormulaDB> {
    return this.post<Omit<FormulaDB, "id">, FormulaDB>("/formulas", formula);
  }

  async actualizarFormula(id: number, formula: Partial<FormulaDB>): Promise<FormulaDB> {
    return this.put<Partial<FormulaDB>, FormulaDB>(`/formulas/${id}`, formula);
  }

  async eliminarFormula(id: number): Promise<{ success: boolean }> {
    return this.delete(`/formulas/${id}`);
  }

  async obtenerFormulasPorDisciplina(disciplinaId: number): Promise<FormulaDB[]> {
    const formulas = await this.obtenerFormulas();
    return formulas.filter((formula) => formula.disciplinaId === disciplinaId);
  }

  async obtenerFormulasPorPeriodo(periodoId: number): Promise<FormulaDB[]> {
    const formulas = await this.obtenerFormulas();
    return formulas.filter((formula) => formula.periodoId === periodoId);
  }

  async obtenerFormulaPorDisciplinaYPeriodo(disciplinaId: number, periodoId: number): Promise<FormulaDB | null> {
    const formulas = await this.obtenerFormulas();
    return formulas.find((formula) => formula.disciplinaId === disciplinaId && formula.periodoId === periodoId) || null;
  }
}

// Instancia singleton para usar en toda la aplicación
export const formulasApi = new FormulasApi();