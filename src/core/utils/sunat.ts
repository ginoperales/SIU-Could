export interface SunatRucResponse {
  ruc: string;
  razonSocial: string;
  nombreComercial: string | null;
  direccion: string;
  estado: string;
  condicion: string;
  departamento: string;
  provincia: string;
  distrito: string;
}

export interface SunatDniResponse {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto?: string;
  success?: boolean;
  message?: string;
}

const API_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Imdpbi56dS5rZW5AZ21haWwuY29tIn0.C7_wRDP1F6Fy2FeyXWqbpKk9e4XyDmgFnxhwYp5SdgE';

/**
 * Consults Peru SUNAT API for a given RUC using the APIS Perú service.
 * @param ruc 11-digit RUC string
 * @returns SunatRucResponse object or null if not found/error
 */
export async function consultarRuc(ruc: string): Promise<SunatRucResponse | null> {
  if (!ruc || ruc.length !== 11 || !/^\d+$/.test(ruc)) {
    return null;
  }

  const url = `https://dniruc.apisperu.com/api/v1/ruc/${ruc}?token=${API_TOKEN}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data && data.ruc) {
      return data as SunatRucResponse;
    }
    return null;
  } catch (err) {
    console.error(`[SUNAT API] Error querying RUC ${ruc}:`, err);
    return null;
  }
}

/**
 * Consults Peru DNI database via the APIS Perú service.
 * @param dni 8-digit DNI string
 * @returns SunatDniResponse object or null if not found/error
 */
export async function consultarDni(dni: string): Promise<SunatDniResponse | null> {
  if (!dni || dni.length !== 8 || !/^\d+$/.test(dni)) {
    return null;
  }

  const url = `https://dniruc.apisperu.com/api/v1/dni/${dni}?token=${API_TOKEN}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    // API returns { success: false, message: "No se encontraron resultados." } when not found
    if (data && data.success === false) {
      return null;
    }
    if (data && data.dni) {
      const result: SunatDniResponse = {
        ...data,
        nombreCompleto: `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`.trim()
      };
      return result;
    }
    return null;
  } catch (err) {
    console.error(`[SUNAT API] Error querying DNI ${dni}:`, err);
    return null;
  }
}

