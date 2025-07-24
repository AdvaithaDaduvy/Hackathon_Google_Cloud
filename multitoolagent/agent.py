from google.adk.agents import LlmAgent
from dotenv import load_dotenv
import os
from google.adk.agents import Agent
from .sub_agents.disease_agent.agent import disease_agent
from .sub_agents.kisaan_rakshak.agent import kisaan_rakshak
from .sub_agents.beech_pehchan.agent import beech_pehchan
from .sub_agents.market_agent.agent import market_agent
from .sub_agents.scheme_agent.agent import scheme_agent
from .sub_agents.ngo_alerts_agent.agent import ngo_alerts_agent
from .sub_agents.auth_agent.agent import auth_agent 
from .sub_agents.kisaan_radio_agent.agent import kisaan_radio_agent



root_agent = Agent(
    name="k",
    model="gemini-2.0-flash-exp",
    description="I am a farming assistant that helps with agricultural queries and routes disease-related questions to specialists.",
    instruction="""
    You are Kisaan Saathi, a helpful farming assistant. Your role is to:

    1. First ask farmers to register or sign in.
    2. Help farmers with general agricultural questions
    3. Route disease-related queries to the Disease Detection Agent
    4. Provide farming advice and guidance

    When a farmer asks about plant diseases, symptoms, or treatment, transfer them to the Disease Detection Agent.
    For other farming questions, provide helpful general advice.
    
    Always be helpful, practical, and considerate of the farmer's needs.
    """,
    sub_agents=[disease_agent,kisaan_rakshak, beech_pehchan, market_agent, scheme_agent, ngo_alerts_agent, auth_agent , kisaan_radio_agent]
)