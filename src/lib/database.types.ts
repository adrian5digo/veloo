// Generado desde Supabase (MCP generate_typescript_types). No editar a mano: regenerar tras cada migración.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accesos: {
        Row: {
          correo: string
          creado_en: string
          id: string
          orden_id: string
          revocado_en: string | null
          set_id: string
          token_hash: string
          ultimo_uso_en: string | null
        }
        Insert: {
          correo: string
          creado_en?: string
          id?: string
          orden_id: string
          revocado_en?: string | null
          set_id: string
          token_hash: string
          ultimo_uso_en?: string | null
        }
        Update: {
          correo?: string
          creado_en?: string
          id?: string
          orden_id?: string
          revocado_en?: string | null
          set_id?: string
          token_hash?: string
          ultimo_uso_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accesos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: true
            referencedRelation: "mis_compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accesos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: true
            referencedRelation: "mis_ventas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accesos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: true
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accesos_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "contadores_set"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "accesos_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
        ]
      }
      ajustes_creadora: {
        Row: {
          creadora_id: string
          notificar_moderacion: boolean
          notificar_retiros: boolean
          notificar_ventas: boolean
          paises_bloqueados: string[]
        }
        Insert: {
          creadora_id: string
          notificar_moderacion?: boolean
          notificar_retiros?: boolean
          notificar_ventas?: boolean
          paises_bloqueados?: string[]
        }
        Update: {
          creadora_id?: string
          notificar_moderacion?: boolean
          notificar_retiros?: boolean
          notificar_ventas?: boolean
          paises_bloqueados?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "ajustes_creadora_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: true
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "ajustes_creadora_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: true
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      bajas_correo: {
        Row: {
          correo: string
          creado_en: string
          creadora_id: string
        }
        Insert: {
          correo: string
          creado_en?: string
          creadora_id: string
        }
        Update: {
          correo?: string
          creado_en?: string
          creadora_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bajas_correo_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "bajas_correo_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      bancos: {
        Row: {
          codigo: string
          nombre: string
        }
        Insert: {
          codigo: string
          nombre: string
        }
        Update: {
          codigo?: string
          nombre?: string
        }
        Relationships: []
      }
      bloqueos: {
        Row: {
          correo: string
          creado_en: string
          creadora_id: string
          orden_id: string | null
        }
        Insert: {
          correo: string
          creado_en?: string
          creadora_id: string
          orden_id?: string | null
        }
        Update: {
          correo?: string
          creado_en?: string
          creadora_id?: string
          orden_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bloqueos_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "bloqueos_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "mis_compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "mis_ventas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      cfdis: {
        Row: {
          comision_centavos: number
          creadora_id: string
          emitido_en: string | null
          id: string
          pdf_path: string | null
          periodo: string
          uuid_sat: string | null
          xml_path: string | null
        }
        Insert: {
          comision_centavos: number
          creadora_id: string
          emitido_en?: string | null
          id?: string
          pdf_path?: string | null
          periodo: string
          uuid_sat?: string | null
          xml_path?: string | null
        }
        Update: {
          comision_centavos?: number
          creadora_id?: string
          emitido_en?: string | null
          id?: string
          pdf_path?: string | null
          periodo?: string
          uuid_sat?: string | null
          xml_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cfdis_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "cfdis_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      cobros_suscripcion: {
        Row: {
          comision_centavos: number
          creado_en: string
          creadora_id: string
          fan_id: string
          id: string
          neto_centavos: number | null
          periodo_desde: string
          periodo_hasta: string
          suscripcion_id: string
          tokens: number
        }
        Insert: {
          comision_centavos: number
          creado_en?: string
          creadora_id: string
          fan_id: string
          id?: string
          neto_centavos?: number | null
          periodo_desde: string
          periodo_hasta: string
          suscripcion_id: string
          tokens: number
        }
        Update: {
          comision_centavos?: number
          creado_en?: string
          creadora_id?: string
          fan_id?: string
          id?: string
          neto_centavos?: number | null
          periodo_desde?: string
          periodo_hasta?: string
          suscripcion_id?: string
          tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "cobros_suscripcion_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "cobros_suscripcion_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_suscripcion_fan_id_fkey"
            columns: ["fan_id"]
            isOneToOne: false
            referencedRelation: "fans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_suscripcion_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "mis_suscripciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_suscripcion_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "suscripciones"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_tokens: {
        Row: {
          actualizado_en: string
          creada_en: string
          estado: Database["public"]["Enums"]["estado_compra_tokens"]
          fan_id: string
          folio: number
          id: string
          pagada_en: string | null
          precio_centavos: number
          procesador: string
          procesador_ref: string | null
          tokens: number
        }
        Insert: {
          actualizado_en?: string
          creada_en?: string
          estado?: Database["public"]["Enums"]["estado_compra_tokens"]
          fan_id: string
          folio?: never
          id?: string
          pagada_en?: string | null
          precio_centavos: number
          procesador: string
          procesador_ref?: string | null
          tokens: number
        }
        Update: {
          actualizado_en?: string
          creada_en?: string
          estado?: Database["public"]["Enums"]["estado_compra_tokens"]
          fan_id?: string
          folio?: never
          id?: string
          pagada_en?: string | null
          precio_centavos?: number
          procesador?: string
          procesador_ref?: string | null
          tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_tokens_fan_id_fkey"
            columns: ["fan_id"]
            isOneToOne: false
            referencedRelation: "fans"
            referencedColumns: ["id"]
          },
        ]
      }
      conversaciones: {
        Row: {
          correo_creadora_en: string | null
          correo_fan_en: string | null
          creada_en: string
          creadora_id: string
          fan_id: string
          id: string
          leida_creadora_en: string
          leida_fan_en: string
          ultimo_en: string
        }
        Insert: {
          correo_creadora_en?: string | null
          correo_fan_en?: string | null
          creada_en?: string
          creadora_id: string
          fan_id: string
          id?: string
          leida_creadora_en?: string
          leida_fan_en?: string
          ultimo_en?: string
        }
        Update: {
          correo_creadora_en?: string | null
          correo_fan_en?: string | null
          creada_en?: string
          creadora_id?: string
          fan_id?: string
          id?: string
          leida_creadora_en?: string
          leida_fan_en?: string
          ultimo_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversaciones_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "conversaciones_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversaciones_fan_id_fkey"
            columns: ["fan_id"]
            isOneToOne: false
            referencedRelation: "fans"
            referencedColumns: ["id"]
          },
        ]
      }
      creadoras: {
        Row: {
          actualizado_en: string
          avatar_path: string | null
          bio: string | null
          creada_en: string
          id: string
          mensajes_abiertos: boolean
          nombre: string | null
          suscripcion_tokens: number | null
          usuario: string | null
          usuario_cambiado_en: string | null
          verificacion: Database["public"]["Enums"]["estado_verificacion"]
        }
        Insert: {
          actualizado_en?: string
          avatar_path?: string | null
          bio?: string | null
          creada_en?: string
          id: string
          mensajes_abiertos?: boolean
          nombre?: string | null
          suscripcion_tokens?: number | null
          usuario?: string | null
          usuario_cambiado_en?: string | null
          verificacion?: Database["public"]["Enums"]["estado_verificacion"]
        }
        Update: {
          actualizado_en?: string
          avatar_path?: string | null
          bio?: string | null
          creada_en?: string
          id?: string
          mensajes_abiertos?: boolean
          nombre?: string | null
          suscripcion_tokens?: number | null
          usuario?: string | null
          usuario_cambiado_en?: string | null
          verificacion?: Database["public"]["Enums"]["estado_verificacion"]
        }
        Relationships: []
      }
      creadoras_privado: {
        Row: {
          actualizado_en: string
          codigo_postal_fiscal: string | null
          fecha_nacimiento: string | null
          id: string
          nombre_legal: string | null
          regimen_fiscal: string | null
          rfc: string | null
        }
        Insert: {
          actualizado_en?: string
          codigo_postal_fiscal?: string | null
          fecha_nacimiento?: string | null
          id: string
          nombre_legal?: string | null
          regimen_fiscal?: string | null
          rfc?: string | null
        }
        Update: {
          actualizado_en?: string
          codigo_postal_fiscal?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre_legal?: string | null
          regimen_fiscal?: string | null
          rfc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creadoras_privado_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "creadoras_privado_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      creadoras_prueba: {
        Row: {
          activa: boolean
          creada_en: string
          creadora_id: string
          motivo: string
        }
        Insert: {
          activa?: boolean
          creada_en?: string
          creadora_id: string
          motivo: string
        }
        Update: {
          activa?: boolean
          creada_en?: string
          creadora_id?: string
          motivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "creadoras_prueba_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: true
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "creadoras_prueba_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: true
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      cuentas_bancarias: {
        Row: {
          banco_codigo: string | null
          clabe: string
          confirmada_en: string | null
          creada_en: string
          creadora_id: string
          estado: Database["public"]["Enums"]["estado_cuenta_bancaria"]
          id: string
          retiros_pausados_hasta: string | null
          titular: string
          token_confirmacion_hash: string | null
        }
        Insert: {
          banco_codigo?: string | null
          clabe: string
          confirmada_en?: string | null
          creada_en?: string
          creadora_id: string
          estado?: Database["public"]["Enums"]["estado_cuenta_bancaria"]
          id?: string
          retiros_pausados_hasta?: string | null
          titular: string
          token_confirmacion_hash?: string | null
        }
        Update: {
          banco_codigo?: string | null
          clabe?: string
          confirmada_en?: string | null
          creada_en?: string
          creadora_id?: string
          estado?: Database["public"]["Enums"]["estado_cuenta_bancaria"]
          id?: string
          retiros_pausados_hasta?: string | null
          titular?: string
          token_confirmacion_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cuentas_bancarias_banco_codigo_fkey"
            columns: ["banco_codigo"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "cuentas_bancarias_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "cuentas_bancarias_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      decisiones_moderacion: {
        Row: {
          creada_en: string
          decision: Database["public"]["Enums"]["decision_moderacion"]
          id: string
          motivo_codigo: string | null
          nota_interna: string | null
          set_id: string
          staff_id: string
        }
        Insert: {
          creada_en?: string
          decision: Database["public"]["Enums"]["decision_moderacion"]
          id?: string
          motivo_codigo?: string | null
          nota_interna?: string | null
          set_id: string
          staff_id: string
        }
        Update: {
          creada_en?: string
          decision?: Database["public"]["Enums"]["decision_moderacion"]
          id?: string
          motivo_codigo?: string | null
          nota_interna?: string | null
          set_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisiones_moderacion_motivo_codigo_fkey"
            columns: ["motivo_codigo"]
            isOneToOne: false
            referencedRelation: "motivos_rechazo"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "decisiones_moderacion_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "contadores_set"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "decisiones_moderacion_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisiones_moderacion_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      envios: {
        Row: {
          creado_en: string
          creadora_id: string
          destinatarios: number
          grupo: string
          id: string
          set_id: string
        }
        Insert: {
          creado_en?: string
          creadora_id: string
          destinatarios?: number
          grupo: string
          id?: string
          set_id: string
        }
        Update: {
          creado_en?: string
          creadora_id?: string
          destinatarios?: number
          grupo?: string
          id?: string
          set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "envios_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "envios_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envios_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "contadores_set"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "envios_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_pago: {
        Row: {
          evento_id: string
          id: number
          orden_id: string | null
          payload: Json
          procesado_en: string | null
          procesador: string
          recibido_en: string
          tipo: string
        }
        Insert: {
          evento_id: string
          id?: never
          orden_id?: string | null
          payload: Json
          procesado_en?: string | null
          procesador: string
          recibido_en?: string
          tipo: string
        }
        Update: {
          evento_id?: string
          id?: never
          orden_id?: string | null
          payload?: Json
          procesado_en?: string | null
          procesador?: string
          recibido_en?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_pago_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "mis_compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_pago_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "mis_ventas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_pago_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      fans: {
        Row: {
          creado_en: string
          id: string
          mayor_edad_en: string | null
          nombre_visible: string | null
        }
        Insert: {
          creado_en?: string
          id: string
          mayor_edad_en?: string | null
          nombre_visible?: string | null
        }
        Update: {
          creado_en?: string
          id?: string
          mayor_edad_en?: string | null
          nombre_visible?: string | null
        }
        Relationships: []
      }
      intentos_acceso: {
        Row: {
          cantidad: number
          clave: string
          desde: string
        }
        Insert: {
          cantidad?: number
          clave: string
          desde?: string
        }
        Update: {
          cantidad?: number
          clave?: string
          desde?: string
        }
        Relationships: []
      }
      links_creadora: {
        Row: {
          activo: boolean
          actualizado_en: string
          clics: number
          creado_en: string
          creadora_id: string
          id: string
          orden: number
          red: Database["public"]["Enums"]["red_link"]
          titulo: string
          url: string
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          clics?: number
          creado_en?: string
          creadora_id: string
          id?: string
          orden?: number
          red?: Database["public"]["Enums"]["red_link"]
          titulo: string
          url: string
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          clics?: number
          creado_en?: string
          creadora_id?: string
          id?: string
          orden?: number
          red?: Database["public"]["Enums"]["red_link"]
          titulo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_creadora_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "links_creadora_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      lista_aviso: {
        Row: {
          correo: string
          creado_en: string
          creadora_id: string
        }
        Insert: {
          correo: string
          creado_en?: string
          creadora_id: string
        }
        Update: {
          correo?: string
          creado_en?: string
          creadora_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lista_aviso_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "lista_aviso_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      me_gusta: {
        Row: {
          creado_en: string
          fan_id: string
          set_id: string
        }
        Insert: {
          creado_en?: string
          fan_id: string
          set_id: string
        }
        Update: {
          creado_en?: string
          fan_id?: string
          set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "me_gusta_fan_id_fkey"
            columns: ["fan_id"]
            isOneToOne: false
            referencedRelation: "fans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "me_gusta_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "contadores_set"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "me_gusta_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
        ]
      }
      medios: {
        Row: {
          alto: number | null
          ancho: number | null
          bytes: number | null
          creado_en: string
          creadora_id: string
          duracion_seg: number | null
          estado: Database["public"]["Enums"]["estado_medio"]
          id: string
          orden: number
          set_id: string | null
          tipo: Database["public"]["Enums"]["tipo_medio"]
          vista_previa: Database["public"]["Enums"]["vista_previa_video"] | null
        }
        Insert: {
          alto?: number | null
          ancho?: number | null
          bytes?: number | null
          creado_en?: string
          creadora_id: string
          duracion_seg?: number | null
          estado?: Database["public"]["Enums"]["estado_medio"]
          id?: string
          orden?: number
          set_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_medio"]
          vista_previa?:
            | Database["public"]["Enums"]["vista_previa_video"]
            | null
        }
        Update: {
          alto?: number | null
          ancho?: number | null
          bytes?: number | null
          creado_en?: string
          creadora_id?: string
          duracion_seg?: number | null
          estado?: Database["public"]["Enums"]["estado_medio"]
          id?: string
          orden?: number
          set_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_medio"]
          vista_previa?:
            | Database["public"]["Enums"]["vista_previa_video"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "medios_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "medios_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medios_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "contadores_set"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "medios_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes: {
        Row: {
          autor: string
          conversacion_id: string
          creado_en: string
          id: number
          set_id: string | null
          texto: string | null
        }
        Insert: {
          autor: string
          conversacion_id: string
          creado_en?: string
          id?: never
          set_id?: string | null
          texto?: string | null
        }
        Update: {
          autor?: string
          conversacion_id?: string
          creado_en?: string
          id?: never
          set_id?: string | null
          texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "bandeja_creadora"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "bandeja_fan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "conversaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "contadores_set"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "mensajes_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
        ]
      }
      motivos_rechazo: {
        Row: {
          activo: boolean
          codigo: string
          texto_para_creadora: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          texto_para_creadora: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          texto_para_creadora?: string
        }
        Relationships: []
      }
      movimientos_saldo: {
        Row: {
          cobro_suscripcion_id: string | null
          creado_en: string
          creadora_id: string
          disponible_desde: string
          id: number
          monto_centavos: number
          nota: string | null
          orden_id: string | null
          retiro_id: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Insert: {
          cobro_suscripcion_id?: string | null
          creado_en?: string
          creadora_id: string
          disponible_desde?: string
          id?: never
          monto_centavos: number
          nota?: string | null
          orden_id?: string | null
          retiro_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Update: {
          cobro_suscripcion_id?: string | null
          creado_en?: string
          creadora_id?: string
          disponible_desde?: string
          id?: never
          monto_centavos?: number
          nota?: string | null
          orden_id?: string | null
          retiro_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_saldo_cobro_suscripcion_id_fkey"
            columns: ["cobro_suscripcion_id"]
            isOneToOne: true
            referencedRelation: "cobros_suscripcion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_saldo_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "movimientos_saldo_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_saldo_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "mis_compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_saldo_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "mis_ventas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_saldo_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_saldo_retiro_id_fkey"
            columns: ["retiro_id"]
            isOneToOne: false
            referencedRelation: "retiros"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_tokens: {
        Row: {
          cobro_suscripcion_id: string | null
          compra_id: string | null
          creado_en: string
          fan_id: string
          id: number
          orden_id: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento_tokens"]
          tokens: number
        }
        Insert: {
          cobro_suscripcion_id?: string | null
          compra_id?: string | null
          creado_en?: string
          fan_id: string
          id?: never
          orden_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento_tokens"]
          tokens: number
        }
        Update: {
          cobro_suscripcion_id?: string | null
          compra_id?: string | null
          creado_en?: string
          fan_id?: string
          id?: never
          orden_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimiento_tokens"]
          tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_tokens_cobro_suscripcion_id_fkey"
            columns: ["cobro_suscripcion_id"]
            isOneToOne: true
            referencedRelation: "cobros_suscripcion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_tokens_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_tokens_fan_id_fkey"
            columns: ["fan_id"]
            isOneToOne: false
            referencedRelation: "fans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_tokens_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: true
            referencedRelation: "mis_compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_tokens_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: true
            referencedRelation: "mis_ventas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_tokens_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: true
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes: {
        Row: {
          actualizado_en: string
          comision_centavos: number
          confirmada_por: string | null
          correo: string
          creada_en: string
          creadora_id: string
          estado: Database["public"]["Enums"]["estado_orden"]
          fan_id: string | null
          folio: number
          id: string
          metodo: Database["public"]["Enums"]["metodo_pago"]
          neto_centavos: number | null
          oxxo_referencia: string | null
          pagada_en: string | null
          pais: string | null
          precio_centavos: number
          procesador: string
          procesador_ref: string | null
          set_id: string
          spei_clabe: string | null
          spei_referencia: string | null
          vence_en: string | null
        }
        Insert: {
          actualizado_en?: string
          comision_centavos: number
          confirmada_por?: string | null
          correo: string
          creada_en?: string
          creadora_id: string
          estado?: Database["public"]["Enums"]["estado_orden"]
          fan_id?: string | null
          folio?: never
          id?: string
          metodo: Database["public"]["Enums"]["metodo_pago"]
          neto_centavos?: number | null
          oxxo_referencia?: string | null
          pagada_en?: string | null
          pais?: string | null
          precio_centavos: number
          procesador: string
          procesador_ref?: string | null
          set_id: string
          spei_clabe?: string | null
          spei_referencia?: string | null
          vence_en?: string | null
        }
        Update: {
          actualizado_en?: string
          comision_centavos?: number
          confirmada_por?: string | null
          correo?: string
          creada_en?: string
          creadora_id?: string
          estado?: Database["public"]["Enums"]["estado_orden"]
          fan_id?: string | null
          folio?: never
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_pago"]
          neto_centavos?: number | null
          oxxo_referencia?: string | null
          pagada_en?: string | null
          pais?: string | null
          precio_centavos?: number
          procesador?: string
          procesador_ref?: string | null
          set_id?: string
          spei_clabe?: string | null
          spei_referencia?: string | null
          vence_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_confirmada_por_fkey"
            columns: ["confirmada_por"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "ordenes_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_fan_id_fkey"
            columns: ["fan_id"]
            isOneToOne: false
            referencedRelation: "fans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "contadores_set"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "ordenes_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
        ]
      }
      personas_set: {
        Row: {
          coincidencia_facial: number | null
          creado_en: string
          enviado_en: string | null
          estado_firma: Database["public"]["Enums"]["estado_firma"]
          fecha_nacimiento: string | null
          firma_path: string | null
          firmado_en: string | null
          id: string
          ine_frente_path: string | null
          ine_reverso_path: string | null
          nombre_legal: string | null
          prueba_vida: boolean | null
          retirado_en: string | null
          selfie_path: string | null
          set_id: string
          telefono: string
          token_hash: string | null
        }
        Insert: {
          coincidencia_facial?: number | null
          creado_en?: string
          enviado_en?: string | null
          estado_firma?: Database["public"]["Enums"]["estado_firma"]
          fecha_nacimiento?: string | null
          firma_path?: string | null
          firmado_en?: string | null
          id?: string
          ine_frente_path?: string | null
          ine_reverso_path?: string | null
          nombre_legal?: string | null
          prueba_vida?: boolean | null
          retirado_en?: string | null
          selfie_path?: string | null
          set_id: string
          telefono: string
          token_hash?: string | null
        }
        Update: {
          coincidencia_facial?: number | null
          creado_en?: string
          enviado_en?: string | null
          estado_firma?: Database["public"]["Enums"]["estado_firma"]
          fecha_nacimiento?: string | null
          firma_path?: string | null
          firmado_en?: string | null
          id?: string
          ine_frente_path?: string | null
          ine_reverso_path?: string | null
          nombre_legal?: string | null
          prueba_vida?: boolean | null
          retirado_en?: string | null
          selfie_path?: string | null
          set_id?: string
          telefono?: string
          token_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personas_set_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "contadores_set"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "personas_set_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
        ]
      }
      publicaciones_prueba: {
        Row: {
          creada_en: string
          creadora_id: string
          id: string
          motivo: string
          set_id: string
        }
        Insert: {
          creada_en?: string
          creadora_id: string
          id?: string
          motivo: string
          set_id: string
        }
        Update: {
          creada_en?: string
          creadora_id?: string
          id?: string
          motivo?: string
          set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publicaciones_prueba_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "publicaciones_prueba_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicaciones_prueba_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "contadores_set"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "publicaciones_prueba_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_staff: {
        Row: {
          accion: string
          creado_en: string
          id: number
          recurso_id: string
          recurso_tipo: string
          staff_id: string
        }
        Insert: {
          accion: string
          creado_en?: string
          id?: never
          recurso_id: string
          recurso_tipo: string
          staff_id: string
        }
        Update: {
          accion?: string
          creado_en?: string
          id?: never
          recurso_id?: string
          recurso_tipo?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registro_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes: {
        Row: {
          conversacion_id: string | null
          correo_contacto: string | null
          creado_en: string
          creadora_id: string | null
          detalle: string | null
          estado: Database["public"]["Enums"]["estado_reporte"]
          folio: string
          id: string
          ip_hash: string | null
          motivo: Database["public"]["Enums"]["motivo_reporte"]
          resuelto_en: string | null
          resuelto_por: string | null
          set_id: string | null
          urgente: boolean
        }
        Insert: {
          conversacion_id?: string | null
          correo_contacto?: string | null
          creado_en?: string
          creadora_id?: string | null
          detalle?: string | null
          estado?: Database["public"]["Enums"]["estado_reporte"]
          folio?: string
          id?: string
          ip_hash?: string | null
          motivo: Database["public"]["Enums"]["motivo_reporte"]
          resuelto_en?: string | null
          resuelto_por?: string | null
          set_id?: string | null
          urgente?: boolean
        }
        Update: {
          conversacion_id?: string | null
          correo_contacto?: string | null
          creado_en?: string
          creadora_id?: string | null
          detalle?: string | null
          estado?: Database["public"]["Enums"]["estado_reporte"]
          folio?: string
          id?: string
          ip_hash?: string | null
          motivo?: Database["public"]["Enums"]["motivo_reporte"]
          resuelto_en?: string | null
          resuelto_por?: string | null
          set_id?: string | null
          urgente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reportes_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "bandeja_creadora"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "bandeja_fan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "conversaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "reportes_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_resuelto_por_fkey"
            columns: ["resuelto_por"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "contadores_set"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "reportes_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
        ]
      }
      retiros: {
        Row: {
          actualizado_en: string
          creadora_id: string
          cuenta_id: string
          estado: Database["public"]["Enums"]["estado_retiro"]
          id: string
          monto_centavos: number
          motivo_fallo: string | null
          pagado_en: string | null
          rastreo_spei: string | null
          solicitado_en: string
        }
        Insert: {
          actualizado_en?: string
          creadora_id: string
          cuenta_id: string
          estado?: Database["public"]["Enums"]["estado_retiro"]
          id?: string
          monto_centavos: number
          motivo_fallo?: string | null
          pagado_en?: string | null
          rastreo_spei?: string | null
          solicitado_en?: string
        }
        Update: {
          actualizado_en?: string
          creadora_id?: string
          cuenta_id?: string
          estado?: Database["public"]["Enums"]["estado_retiro"]
          id?: string
          monto_centavos?: number
          motivo_fallo?: string | null
          pagado_en?: string | null
          rastreo_spei?: string | null
          solicitado_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "retiros_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "retiros_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retiros_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "cuentas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retiros_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "mi_cuenta_bancaria"
            referencedColumns: ["id"]
          },
        ]
      }
      seguimientos: {
        Row: {
          creado_en: string
          creadora_id: string
          fan_id: string
        }
        Insert: {
          creado_en?: string
          creadora_id: string
          fan_id: string
        }
        Update: {
          creado_en?: string
          creadora_id?: string
          fan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguimientos_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "seguimientos_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimientos_fan_id_fkey"
            columns: ["fan_id"]
            isOneToOne: false
            referencedRelation: "fans"
            referencedColumns: ["id"]
          },
        ]
      }
      sets: {
        Row: {
          actualizado_en: string
          avisado_en: string | null
          con_otras_personas: boolean
          creado_en: string
          creadora_id: string
          declaracion_en: string | null
          enviado_en: string | null
          estado: Database["public"]["Enums"]["estado_set"]
          id: string
          motivo_rechazo: string | null
          oculto_motivo: string | null
          portada_id: string | null
          precio_centavos: number
          publicado_en: string | null
          retirado_en: string | null
          slug: string
          titulo: string
        }
        Insert: {
          actualizado_en?: string
          avisado_en?: string | null
          con_otras_personas?: boolean
          creado_en?: string
          creadora_id: string
          declaracion_en?: string | null
          enviado_en?: string | null
          estado?: Database["public"]["Enums"]["estado_set"]
          id?: string
          motivo_rechazo?: string | null
          oculto_motivo?: string | null
          portada_id?: string | null
          precio_centavos: number
          publicado_en?: string | null
          retirado_en?: string | null
          slug?: string
          titulo: string
        }
        Update: {
          actualizado_en?: string
          avisado_en?: string | null
          con_otras_personas?: boolean
          creado_en?: string
          creadora_id?: string
          declaracion_en?: string | null
          enviado_en?: string | null
          estado?: Database["public"]["Enums"]["estado_set"]
          id?: string
          motivo_rechazo?: string | null
          oculto_motivo?: string | null
          portada_id?: string | null
          precio_centavos?: number
          publicado_en?: string | null
          retirado_en?: string | null
          slug?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "sets_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "sets_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sets_portada_fk"
            columns: ["portada_id"]
            isOneToOne: false
            referencedRelation: "medios"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          creado_en: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_staff"]
        }
        Insert: {
          creado_en?: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_staff"]
        }
        Update: {
          creado_en?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_staff"]
        }
        Relationships: []
      }
      suscripciones: {
        Row: {
          actualizado_en: string
          creada_en: string
          creadora_id: string
          fan_id: string
          fin_motivo: string | null
          id: string
          periodo_hasta: string
          renovar: boolean
          tokens: number
        }
        Insert: {
          actualizado_en?: string
          creada_en?: string
          creadora_id: string
          fan_id: string
          fin_motivo?: string | null
          id?: string
          periodo_hasta: string
          renovar?: boolean
          tokens: number
        }
        Update: {
          actualizado_en?: string
          creada_en?: string
          creadora_id?: string
          fan_id?: string
          fin_motivo?: string | null
          id?: string
          periodo_hasta?: string
          renovar?: boolean
          tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "suscripciones_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripciones_fan_id_fkey"
            columns: ["fan_id"]
            isOneToOne: false
            referencedRelation: "fans"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripciones_push: {
        Row: {
          auth_clave: string
          creada_en: string
          endpoint: string
          id: string
          p256dh: string
          usuario_id: string
        }
        Insert: {
          auth_clave: string
          creada_en?: string
          endpoint: string
          id?: string
          p256dh: string
          usuario_id: string
        }
        Update: {
          auth_clave?: string
          creada_en?: string
          endpoint?: string
          id?: string
          p256dh?: string
          usuario_id?: string
        }
        Relationships: []
      }
      usuarios_acceso: {
        Row: {
          id: string
          usuario: string
        }
        Insert: {
          id: string
          usuario: string
        }
        Update: {
          id?: string
          usuario?: string
        }
        Relationships: []
      }
      verificaciones: {
        Row: {
          actualizado_en: string
          calidad_ok: boolean | null
          coincidencia_facial: number | null
          creada_en: string
          creadora_id: string
          decidida_en: string | null
          decidida_por: string | null
          edad_detectada: number | null
          estado: Database["public"]["Enums"]["estado_intento_identidad"]
          id: string
          ine_frente_path: string | null
          ine_reverso_path: string | null
          ine_vigente: boolean | null
          motivo: string | null
          proveedor: string | null
          proveedor_ref: string | null
          prueba_vida: boolean | null
          selfie_path: string | null
        }
        Insert: {
          actualizado_en?: string
          calidad_ok?: boolean | null
          coincidencia_facial?: number | null
          creada_en?: string
          creadora_id: string
          decidida_en?: string | null
          decidida_por?: string | null
          edad_detectada?: number | null
          estado?: Database["public"]["Enums"]["estado_intento_identidad"]
          id?: string
          ine_frente_path?: string | null
          ine_reverso_path?: string | null
          ine_vigente?: boolean | null
          motivo?: string | null
          proveedor?: string | null
          proveedor_ref?: string | null
          prueba_vida?: boolean | null
          selfie_path?: string | null
        }
        Update: {
          actualizado_en?: string
          calidad_ok?: boolean | null
          coincidencia_facial?: number | null
          creada_en?: string
          creadora_id?: string
          decidida_en?: string | null
          decidida_por?: string | null
          edad_detectada?: number | null
          estado?: Database["public"]["Enums"]["estado_intento_identidad"]
          id?: string
          ine_frente_path?: string | null
          ine_reverso_path?: string | null
          ine_vigente?: boolean | null
          motivo?: string | null
          proveedor?: string | null
          proveedor_ref?: string | null
          prueba_vida?: boolean | null
          selfie_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verificaciones_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "verificaciones_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verificaciones_decidida_por_fkey"
            columns: ["decidida_por"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      bandeja_creadora: {
        Row: {
          bloqueado: boolean | null
          compras: number | null
          fan_nombre: string | null
          id: string | null
          sin_leer: boolean | null
          suscrito: boolean | null
          ultimo_autor: string | null
          ultimo_con_set: boolean | null
          ultimo_en: string | null
          ultimo_texto: string | null
        }
        Relationships: []
      }
      bandeja_fan: {
        Row: {
          creadora_avatar: string | null
          creadora_id: string | null
          creadora_nombre: string | null
          creadora_usuario: string | null
          id: string | null
          sin_leer: boolean | null
          ultimo_autor: string | null
          ultimo_con_set: boolean | null
          ultimo_en: string | null
          ultimo_texto: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversaciones_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "conversaciones_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      contadores_creadora: {
        Row: {
          creadora_id: string | null
          seguidores: number | null
          sets_publicados: number | null
        }
        Insert: {
          creadora_id?: string | null
          seguidores?: never
          sets_publicados?: never
        }
        Update: {
          creadora_id?: string | null
          seguidores?: never
          sets_publicados?: never
        }
        Relationships: []
      }
      contadores_set: {
        Row: {
          me_gusta: number | null
          set_id: string | null
        }
        Insert: {
          me_gusta?: never
          set_id?: string | null
        }
        Update: {
          me_gusta?: never
          set_id?: string | null
        }
        Relationships: []
      }
      mi_cuenta_bancaria: {
        Row: {
          banco: string | null
          clabe: string | null
          creada_en: string | null
          estado: Database["public"]["Enums"]["estado_cuenta_bancaria"] | null
          id: string | null
          retiros_pausados_hasta: string | null
          titular: string | null
        }
        Relationships: []
      }
      mi_lista_aviso: {
        Row: {
          correos: number | null
          ultimo_en: string | null
        }
        Relationships: []
      }
      mi_saldo: {
        Row: {
          disponible_centavos: number | null
          retenido_centavos: number | null
        }
        Relationships: []
      }
      mi_saldo_tokens: {
        Row: {
          tokens: number | null
        }
        Relationships: []
      }
      mis_bloqueos: {
        Row: {
          correo: string | null
          creado_en: string | null
          orden_id: string | null
        }
        Insert: {
          correo?: never
          creado_en?: string | null
          orden_id?: string | null
        }
        Update: {
          correo?: never
          creado_en?: string | null
          orden_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bloqueos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "mis_compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "mis_ventas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      mis_compras: {
        Row: {
          creada_en: string | null
          creadora_nombre: string | null
          creadora_usuario: string | null
          estado: Database["public"]["Enums"]["estado_orden"] | null
          folio: number | null
          id: string | null
          metodo: Database["public"]["Enums"]["metodo_pago"] | null
          oxxo_referencia: string | null
          pagada_en: string | null
          portada_id: string | null
          precio_centavos: number | null
          set_id: string | null
          spei_clabe: string | null
          spei_referencia: string | null
          titulo: string | null
          vence_en: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "contadores_set"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "ordenes_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sets_portada_fk"
            columns: ["portada_id"]
            isOneToOne: false
            referencedRelation: "medios"
            referencedColumns: ["id"]
          },
        ]
      }
      mis_suscripciones: {
        Row: {
          activa: boolean | null
          creadora_avatar: string | null
          creadora_id: string | null
          creadora_nombre: string | null
          creadora_usuario: string | null
          fin_motivo: string | null
          id: string | null
          periodo_hasta: string | null
          renovar: boolean | null
          tokens: number | null
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "contadores_creadora"
            referencedColumns: ["creadora_id"]
          },
          {
            foreignKeyName: "suscripciones_creadora_id_fkey"
            columns: ["creadora_id"]
            isOneToOne: false
            referencedRelation: "creadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      mis_suscriptores: {
        Row: {
          activas: number | null
          neto_30_dias_centavos: number | null
          se_renuevan: number | null
        }
        Relationships: []
      }
      mis_ventas: {
        Row: {
          comision_centavos: number | null
          correo: string | null
          creada_en: string | null
          disponible_en: string | null
          estado: Database["public"]["Enums"]["estado_orden"] | null
          folio: number | null
          id: string | null
          metodo: Database["public"]["Enums"]["metodo_pago"] | null
          neto_centavos: number | null
          pagada_en: string | null
          precio_centavos: number | null
          set_id: string | null
          titulo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "contadores_set"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "ordenes_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
        ]
      }
      personas_de_mis_sets: {
        Row: {
          enviado_en: string | null
          estado_firma: Database["public"]["Enums"]["estado_firma"] | null
          firmado_en: string | null
          id: string | null
          set_id: string | null
          telefono: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personas_set_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "contadores_set"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "personas_set_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      abrir_link: { Args: { p_link: string }; Returns: string }
      acreditar_tokens: { Args: { p_compra: string }; Returns: boolean }
      activar_cuenta_bancaria: {
        Args: { p_cuenta: string }
        Returns: undefined
      }
      asignar_usuario_acceso: {
        Args: { p_usuario: string }
        Returns: undefined
      }
      bloquear_desde_conversacion: {
        Args: { p_conversacion: string }
        Returns: undefined
      }
      bloquear_fan: { Args: { p_orden: string }; Returns: undefined }
      cancelar_suscripcion: { Args: { p_creadora: string }; Returns: string }
      clabe_valida: { Args: { clabe: string }; Returns: boolean }
      cobrar_periodo: { Args: { p_suscripcion: string }; Returns: string }
      confirmar_mayoria_edad: { Args: never; Returns: string }
      confirmar_pago: {
        Args: { p_orden: string; p_token_hash: string }
        Returns: boolean
      }
      confirmar_spei_manual: {
        Args: { p_orden: string; p_staff: string; p_token_hash: string }
        Returns: boolean
      }
      correo_valido: { Args: { correo: string }; Returns: boolean }
      dar_de_baja: {
        Args: { p_correo: string; p_creadora: string }
        Returns: undefined
      }
      desbloquear_con_tokens: {
        Args: { p_set: string; p_token_hash: string }
        Returns: {
          nueva: boolean
          orden_id: string
        }[]
      }
      desbloquear_fan: { Args: { p_orden: string }; Returns: undefined }
      enmascarar_correo: { Args: { correo: string }; Returns: string }
      enviar_a_moderacion: {
        Args: { p_declaro: boolean; p_set: string }
        Returns: undefined
      }
      enviar_set_a_fans: {
        Args: { p_grupo: string; p_set: string; p_texto: string }
        Returns: number
      }
      es_staff: { Args: never; Returns: boolean }
      escribir_a_creadora: {
        Args: { p_creadora: string; p_texto: string }
        Returns: string
      }
      escribir_a_fan: {
        Args: { p_conversacion: string; p_set: string; p_texto: string }
        Returns: number
      }
      esta_bloqueado: {
        Args: { p_correo: string; p_creadora: string }
        Returns: boolean
      }
      fan_de: {
        Args: { p_correo: string; p_creadora: string; p_fan: string }
        Returns: boolean
      }
      marcar_leida: { Args: { p_conversacion: string }; Returns: undefined }
      moderar_set: {
        Args: {
          p_decision: Database["public"]["Enums"]["decision_moderacion"]
          p_motivo?: string
          p_nota?: string
          p_set: string
          p_staff: string
        }
        Returns: undefined
      }
      pedir_aviso: {
        Args: { p_correo: string; p_creadora: string }
        Returns: undefined
      }
      registrar_contracargo: { Args: { p_orden: string }; Returns: undefined }
      renovar_suscripciones: { Args: never; Returns: number }
      reportar_conversacion: {
        Args: {
          p_conversacion: string
          p_detalle: string
          p_motivo: Database["public"]["Enums"]["motivo_reporte"]
        }
        Returns: string
      }
      resolver_reporte: {
        Args: {
          p_estado: Database["public"]["Enums"]["estado_reporte"]
          p_reporte: string
          p_staff: string
        }
        Returns: undefined
      }
      retirar_set: { Args: { p_set: string }; Returns: undefined }
      revertir_retiro: {
        Args: { p_motivo: string; p_retiro: string }
        Returns: undefined
      }
      saldo_de: {
        Args: { p_creadora: string }
        Returns: Record<string, unknown>
      }
      saldo_tokens_de: { Args: { p_fan: string }; Returns: number }
      slug_de: { Args: { texto: string }; Returns: string }
      slug_reservado: { Args: { s: string }; Returns: boolean }
      solicitar_retiro: { Args: { p_monto_centavos: number }; Returns: string }
      suscribirse: { Args: { p_creadora: string }; Returns: string }
      suscripcion_activa: {
        Args: { p_creadora: string; p_fan: string }
        Returns: boolean
      }
      texto_mensaje: { Args: { p_texto: string }; Returns: string }
      tomar_aviso_mensaje: {
        Args: { p_conversacion: string; p_para: string }
        Returns: {
          de: string
          destinatario: string
        }[]
      }
      tomar_aviso_set: {
        Args: { p_set: string }
        Returns: {
          destinatario: string
        }[]
      }
      tomar_avisos_envio: {
        Args: { p_creadora: string; p_desde: string; p_set: string }
        Returns: {
          conversacion: string
          destinatario: string
        }[]
      }
      tomar_intento_acceso: { Args: { p_clave: string }; Returns: boolean }
      usuario_permitido: { Args: { usuario: string }; Returns: boolean }
      vencer_ordenes: { Args: never; Returns: number }
      ver_por_suscripcion: { Args: { p_set: string }; Returns: boolean }
    }
    Enums: {
      decision_moderacion: "aprobado" | "rechazado"
      estado_compra_tokens: "pendiente" | "pagada" | "fallida" | "reembolsada"
      estado_cuenta_bancaria: "por_confirmar" | "activa" | "reemplazada"
      estado_firma:
        | "pendiente"
        | "enviada"
        | "firmada"
        | "rechazada"
        | "retirada"
      estado_intento_identidad:
        | "pendiente"
        | "aprobada"
        | "pide_otra_foto"
        | "rechazada"
      estado_medio: "subiendo" | "procesando" | "lista" | "error"
      estado_orden:
        | "pendiente"
        | "pagada"
        | "vencida"
        | "rechazada"
        | "reembolsada"
        | "contracargo"
      estado_reporte: "abierto" | "sin_falta" | "set_quitado"
      estado_retiro: "solicitado" | "en_proceso" | "pagado" | "fallido"
      estado_set:
        | "borrador"
        | "moderacion"
        | "publicado"
        | "rechazado"
        | "oculto"
        | "retirado"
      estado_verificacion:
        | "pendiente"
        | "en_revision"
        | "aprobada"
        | "rechazada"
      metodo_pago: "tarjeta" | "oxxo" | "spei" | "tokens"
      motivo_reporte:
        | "sin_consentimiento"
        | "posible_menor"
        | "contenido_prohibido"
        | "spam"
        | "otro"
        | "contenido_robado"
        | "datos_personales"
        | "acoso"
      red_link:
        | "instagram"
        | "tiktok"
        | "x"
        | "youtube"
        | "twitch"
        | "spotify"
        | "whatsapp"
        | "telegram"
        | "facebook"
        | "threads"
        | "web"
      rol_staff: "moderacion" | "soporte" | "admin"
      tipo_medio: "foto" | "video"
      tipo_movimiento:
        | "venta"
        | "contracargo"
        | "retiro"
        | "retiro_revertido"
        | "ajuste"
        | "suscripcion"
      tipo_movimiento_tokens:
        | "compra"
        | "desbloqueo"
        | "reembolso"
        | "ajuste"
        | "suscripcion"
      vista_previa_video: "clip" | "portada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      decision_moderacion: ["aprobado", "rechazado"],
      estado_compra_tokens: ["pendiente", "pagada", "fallida", "reembolsada"],
      estado_cuenta_bancaria: ["por_confirmar", "activa", "reemplazada"],
      estado_firma: [
        "pendiente",
        "enviada",
        "firmada",
        "rechazada",
        "retirada",
      ],
      estado_intento_identidad: [
        "pendiente",
        "aprobada",
        "pide_otra_foto",
        "rechazada",
      ],
      estado_medio: ["subiendo", "procesando", "lista", "error"],
      estado_orden: [
        "pendiente",
        "pagada",
        "vencida",
        "rechazada",
        "reembolsada",
        "contracargo",
      ],
      estado_reporte: ["abierto", "sin_falta", "set_quitado"],
      estado_retiro: ["solicitado", "en_proceso", "pagado", "fallido"],
      estado_set: [
        "borrador",
        "moderacion",
        "publicado",
        "rechazado",
        "oculto",
        "retirado",
      ],
      estado_verificacion: [
        "pendiente",
        "en_revision",
        "aprobada",
        "rechazada",
      ],
      metodo_pago: ["tarjeta", "oxxo", "spei", "tokens"],
      motivo_reporte: [
        "sin_consentimiento",
        "posible_menor",
        "contenido_prohibido",
        "spam",
        "otro",
        "contenido_robado",
        "datos_personales",
        "acoso",
      ],
      red_link: [
        "instagram",
        "tiktok",
        "x",
        "youtube",
        "twitch",
        "spotify",
        "whatsapp",
        "telegram",
        "facebook",
        "threads",
        "web",
      ],
      rol_staff: ["moderacion", "soporte", "admin"],
      tipo_medio: ["foto", "video"],
      tipo_movimiento: [
        "venta",
        "contracargo",
        "retiro",
        "retiro_revertido",
        "ajuste",
        "suscripcion",
      ],
      tipo_movimiento_tokens: [
        "compra",
        "desbloqueo",
        "reembolso",
        "ajuste",
        "suscripcion",
      ],
      vista_previa_video: ["clip", "portada"],
    },
  },
} as const

