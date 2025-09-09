import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json());

// Rate limiting: máximo 10 consultas por minuto por IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Demasiadas consultas, intenta nuevamente en un minuto.' }
});
app.use('/api/consulta', limiter);

const OPERATORS = {
  'pullman': {
    url: process.env.PULLMAN_URL,
    headers: {
      'sec-ch-ua-platform': '"Windows"',
      'Authorization': process.env.PULLMAN_AUTH,
      'Cache-Control': 'no-store',
      'Referer': 'https://costas.konnectpro.cl/',
      'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      'X-Api-Key': process.env.API_KEY,
      'sec-ch-ua-mobile': '?0',
      'category_type': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      'Accept': 'application/json'
    },
    sort_field: 'id',
    sort_type: 'desc'
  },
  'rutabus': {
    url: process.env.RUTABUS_URL,
    headers: {
      'sec-ch-ua-platform': '"Windows"',
      'Authorization': process.env.RUTABUS_AUTH,
      'Cache-Control': 'no-store',
      'Referer': 'https://rutabus.konnectpro.cl/',
      'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      'X-Api-Key': process.env.API_KEY,
      'sec-ch-ua-mobile': '?0',
      'category_type': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      'Accept': 'application/json'
    },
    sort_field: 'id',
    sort_type: 'desc'
  },
  'tacoha': {
    url: process.env.TACOHA_URL,
    headers: {
      'accept': 'application/json',
      'accept-language': 'es-ES,es;q=0.9',
      'authorization': process.env.TACOHA_AUTH,
      'cache-control': 'no-store',
      'category_type': '1',
      'origin': 'https://tacoha.konnectpro.cl',
      'priority': 'u=1, i',
      'referer': 'https://tacoha.konnectpro.cl/',
      'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      'x-api-key': process.env.API_KEY
    },
    sort_field: 'id',
    sort_type: 'desc'
  }
};

app.post('/api/consulta', async (req, res) => {
  const { operador, cupon } = req.body;
  const op = OPERATORS[operador];
  if (!op) return res.status(400).json({ error: 'Operador inválido' });

  // Validar formato de cupón (ejemplo: solo letras/números, longitud 8-20)
  if (!/^[A-Z0-9]{8,20}$/i.test(cupon)) {
    return res.status(400).json({ error: 'Formato de cupón inválido' });
  }

  try {
    const params = {
      page: 1,
      items: 10,
      manual_open_ticket_coupons: true,
      sort_field: op.sort_field,
      sort_type: op.sort_type,
      search: cupon,
      locale: 'es'
    };
    const response = await axios.get(op.url, {
      headers: op.headers,
      params
    });
    let data;
    if (operador === 'pullman' || operador === 'tacoha' || operador === 'rutabus') {
      data = response.data?.data?.coupons_records?.[0];
    }
    if (!data) return res.status(404).json({ error: 'Cupón no encontrado' });
    // Formatear fechas al formato chileno
    function formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date)) return dateStr;
      return date.toLocaleString('es-CL', { timeZone: 'America/Santiago' });
    }

    // Hashes de ciudades por operador
    const cityHashes = {
      pullman: {
        1: 'Santiago',
        2: 'Algarrobo',
        3: 'Cartagena',
        4: 'El Quisco',
        5: 'Maitencillo',
        6: 'Quillota',
        7: 'Quilpué',
        8: 'San Antonio',
        9: 'Valparaiso',
        10: 'Villa Alemana',
        11: 'Viña Del Mar',
        12: 'El Tabo',
        13: 'Limache',
        14: 'Los Andes',
        15: 'Olmue',
        16: 'San Felipe',
        17: 'Concón',
        18: 'Llay Llay',
        19: 'Ramayana',
        20: 'Til Til',
        21: 'Laguna Verde',
        22: 'Quintero',
        23: 'Curacavi',
        24: 'La Calera',
        25: 'Santo Domingo',
        26: 'Curauma'
      },
      rutabus: {
        1: 'Santiago', 2: 'Melipilla', 3: 'Las Cabras', 4: 'Litueche', 5: 'Pichilemu', 6: 'Quelentaro', 7: 'Loica', 8: 'Cruce Las Rosas', 9: 'El Manzano', 10: 'Lago Rapel'
      },
      tacoha: {
        1: 'Santiago', 2: 'Las Cabras', 3: 'Peumo', 4: 'Rancagua', 5: 'San Vicente De Tagua Tagua', 6: 'Requinoa', 7: 'Rosario', 8: 'Rengo', 9: 'Pelequen', 10: 'San Francisco', 11: 'Granero', 12: 'Pichidegua', 13: 'Patagua', 14: 'Las Pataguas'
      }
    };

    function getCityName(op, id) {
      if (!id) return '';
      const hash = cityHashes[op];
      return hash && hash[id] ? hash[id] : id;
    }

    const result = {
      coupon_code: data.coupon_code,
      passenger_name: data.passenger_name,
      created_at: formatDate(data.created_on || data.created_at),
      expiry_date: formatDate(data.expiry_date),
      email: data.email,
      mobile_number: data.mobile_number,
      origin: getCityName(operador, data.origin),
      destination: getCityName(operador, data.destination),
      zone: data.zone_id_str || data.zone_id || '',
      status: data.status_str || data.status,
      used_on: formatDate(data.used_on),
      used_by_pnr: data.used_by_pnr
    };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error consultando el cupón' }); // No exponer detalles internos
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
